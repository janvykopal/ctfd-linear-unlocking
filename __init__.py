from flask import (
    abort,
    request,
    render_template,
    redirect,
    jsonify,
    Blueprint,
    url_for,
    Response,
    session
)

from CTFd import utils, challenges
from CTFd.models import db, Challenges, Solves, Tags, Teams, Files, Unlocks, Hints
from CTFd.utils import admins_only, is_admin, authed_only
from CTFd.plugins.challenges import get_chal_class
from CTFd.admin.challenges import admin_delete_chal

from sqlalchemy.sql import or_, expression

class LinearUnlockingModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    is_hidden = db.Column(db.Boolean, server_default=expression.false(), nullable=False)

    def __init__(self, name):
        self.name = name

class LinearUnlockingEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    linearunlockid = db.Column(db.Integer, db.ForeignKey('linear_unlocking_model.id'))
    position = db.Column(db.Integer)
    chalid = db.Column(db.Integer, db.ForeignKey('challenges.id'))
    requires_chalid = db.Column(db.Integer, db.ForeignKey('challenges.id'))

    def __init__(self, linearunlockid, position, chalid, requires_chalid):
        self.linearunlockid = linearunlockid
        self.position = position
        self.chalid = chalid
        self.requires_chalid = requires_chalid

def load(app):
    app.db.create_all()
    
    linear_unlocking = Blueprint('linear_unlocking', __name__, template_folder='templates')
    linear_unlocking_static = Blueprint('linear_unlocking_static', __name__, static_folder='static')
    app.register_blueprint(linear_unlocking)
    app.register_blueprint(linear_unlocking_static, url_prefix='/linear-unlocking')
    
    utils.register_plugin_script("/linear-unlocking/static/linear-unlocking-chalboard.js")

    def get_challenges_by_categories():
        chals = db.session.query(
                Challenges.id,
                Challenges.name,
                Challenges.category
            )
        jchals = []
        for x in chals:
            jchals.append({
                'id':x.id,
                'name':x.name,
                'category':x.category
            })
        # Sort into categories
        categories = set(map(lambda x:x['category'], jchals))
        cats = []
        for c in categories:
            cats.append({
                'name':c,
                'challenges':[j for j in jchals if j['category'] == c]
            })
        return cats

    def get_linear_unlocking_chains():
        chals = db.session.query(
                Challenges.id,
                Challenges.name,
                Challenges.category
            )
        jchals = {}
        for x in chals:
            jchals[x.id] = (x.name, x.category)

        lu_ids = []
        lu_models = LinearUnlockingModel.query.all()
        for lu_model in lu_models:
            lu_entries = LinearUnlockingEntry.query.filter_by(linearunlockid=lu_model.id).all()
            entry = {  
                'id':lu_model.id,
                'name':lu_model.name,
                'is_hidden':lu_model.is_hidden,
                'chain':[]
            }
            for m in lu_entries:
                entry['chain'].append({
                    'chalid':m.chalid,
                    'chalname':jchals[m.chalid][0],
                    'chalcategory':jchals[m.chalid][1]
                })
            lu_ids.append(entry)
        return lu_ids

    @app.route('/admin/plugins/linear-unlocking', methods=['GET', 'POST'])
    @admins_only
    def linear_unlocking_config_view():
        if request.method == 'POST':
            lu_chain = []
            lu_name = request.form['name']
            for i in range(len(request.form)):
                challenge_name = 'challenge[{}]'.format(i)
                if challenge_name in request.form:
                    chalid = request.form[challenge_name]
                    lu_chain.append(chalid)
                else:
                    break

            if len(lu_name) >= 1 and len(lu_chain) >= 2:
                lu = LinearUnlockingModel(lu_name)
                db.session.add(lu)
                db.session.commit()
                lu_id = lu.id

                position = 1
                prev_chalid = -1
                for chalid in lu_chain:
                    lu_entry = LinearUnlockingEntry(linearunlockid=lu_id, position=position, chalid=chalid, requires_chalid=prev_chalid)
                    db.session.add(lu_entry)
                    db.session.commit()
                    position += 1
                    prev_chalid = chalid
        
        return render_template('linear-unlocking-config.html', 
                                challenge_categories=get_challenges_by_categories(),
                                linear_unlocking_chains=get_linear_unlocking_chains())

    @app.route('/admin/plugins/linear-unlocking/delete', methods=['POST'])
    @admins_only
    def linear_unlocking_delete():
        if request.method == 'POST':
            lu_id = request.form['lu_id']
            LinearUnlockingEntry.query.filter_by(linearunlockid=lu_id).delete()
            LinearUnlockingModel.query.filter_by(id=lu_id).delete()
            db.session.commit()
            return redirect('/admin/plugins/linear-unlocking')

    @app.route('/admin/plugins/linear-unlocking/toggle-hide', methods=['POST'])
    @admins_only
    def linear_unlocking_togglehide():
        if request.method == 'POST':
            lu_id = request.form['lu_id']
            is_hide = request.form['is_hide'] == "true"
            lu_model = LinearUnlockingModel.query.filter_by(id=lu_id).first_or_404()
            lu_model.is_hidden = is_hide
            db.session.commit()
            return redirect('/admin/plugins/linear-unlocking')

    @app.route('/linearunlockings')
    def get_linear_unlockings():
        response = {'linearunlockings': []}
        lu_models = LinearUnlockingModel.query.all()
        for lu_model in lu_models:
            lu_entries = LinearUnlockingEntry.query.filter_by(linearunlockid=lu_model.id).all()
            for lu_entry in lu_entries:
                chal = Challenges.query.filter_by(id=lu_entry.chalid).first()
                response['linearunlockings'].append({
                    'id': lu_model.id,
                    'is_hidden': lu_model.is_hidden,
                    'chalid': lu_entry.chalid,
                    'chalname': chal.name,
                    'requires_chalid': lu_entry.requires_chalid
                })
        db.session.close()
        return jsonify(response)

    # Overwriting existing route for retrieving chal view
    def chal_view_linearunlocked(chal_id):
        teamid = session.get('id')

        chal = Challenges.query.filter_by(id=chal_id).first_or_404()
        chal_class = get_chal_class(chal.type)

        # Get solved challenge ids
        solves = []
        if utils.is_admin():
            solves = Solves.query.filter_by(teamid=session['id']).all()
        elif utils.user_can_view_challenges():
            if utils.authed():
                solves = Solves.query\
                    .join(Teams, Solves.teamid == Teams.id)\
                    .filter(Solves.teamid == session['id'])\
                    .all()
        solve_ids = []
        for solve in solves:
            solve_ids.append(solve.chalid)

        # Return nothing if there is at least one linear unlocking requirement not solved
        lu_entries = LinearUnlockingEntry.query.filter_by(chalid=chal.id).all()
        for lu_entry in lu_entries:
            if lu_entry.requires_chalid > -1 and lu_entry.requires_chalid not in solve_ids:
                return jsonify([])

        tags = [tag.tag for tag in Tags.query.add_columns('tag').filter_by(chal=chal.id).all()]
        files = [str(f.location) for f in Files.query.filter_by(chal=chal.id).all()]
        unlocked_hints = set([u.itemid for u in Unlocks.query.filter_by(model='hints', teamid=teamid)])
        hints = []

        for hint in Hints.query.filter_by(chal=chal.id).all():
            if hint.id in unlocked_hints or utils.ctf_ended():
                hints.append({'id': hint.id, 'cost': hint.cost, 'hint': hint.hint})
            else:
                hints.append({'id': hint.id, 'cost': hint.cost})

        challenge, response = chal_class.read(challenge=chal)

        response['files'] = files
        response['tags'] = tags
        response['hints'] = hints

        db.session.close()
        return jsonify(response)

    # Overwriting existing route for retrieving chals
    def chals_linearunlocked():
        # Get solved challenge ids
        solves = []
        if utils.is_admin():
            solves = Solves.query.filter_by(teamid=session['id']).all()
        elif utils.user_can_view_challenges():
            if utils.authed():
                solves = Solves.query\
                    .join(Teams, Solves.teamid == Teams.id)\
                    .filter(Solves.teamid == session['id'])\
                    .all()
        solve_ids = []
        for solve in solves:
            solve_ids.append(solve.chalid)

        db_chals = Challenges.query.filter(or_(Challenges.hidden != True, Challenges.hidden == None)).order_by(Challenges.value).all()
        response = {'game': []}
        linearunlock_games = {}
        other_games = []

        for chal in db_chals:
            # Skip if is linear locked and should be hidden
            lu_id = -1
            lu_name = "__NOT_IN_ANY_CHAIN__"
            lu_position = -1
            is_hidden = False
            lu_entries = LinearUnlockingEntry.query.filter_by(chalid=chal.id).all()
            for lu_entry in lu_entries:
                # Initialize lu_id if possible, used for sorting the challenges later
                if lu_id == -1:
                    lu_model = LinearUnlockingModel.query.filter_by(id=lu_entry.linearunlockid).first()
                    lu_id = lu_model.id
                    lu_name = lu_model.name
                    lu_position = lu_entry.position

                if lu_entry.requires_chalid > -1 and lu_entry.requires_chalid not in solve_ids:
                    lu_model = LinearUnlockingModel.query.filter_by(id=lu_entry.linearunlockid).first()
                    if lu_model.is_hidden:
                        is_hidden = True
                        break
            if is_hidden:
                continue

            tags = [tag.tag for tag in Tags.query.add_columns('tag').filter_by(chal=chal.id).all()]
            chal_type = get_chal_class(chal.type)

            game = {'id': chal.id,
                    'type': chal_type.name,
                    'name': chal.name,
                    'value': chal.value,
                    'category': chal.category,
                    'tags': tags,
                    'template': chal_type.templates['modal'],
                    'script': chal_type.scripts['modal'],
                    # Add more info for chain presentation
                    'chainid': lu_id,
                    'chainname': lu_name,
                    'chainposition': lu_position,
                    }
            if lu_id > -1:
                if lu_id not in linearunlock_games:
                    linearunlock_games[lu_id] = []
                linearunlock_games[lu_id].append(game)
            else:
                other_games.append(game)

        # Add all linear unlock chain challenges in sorted order first
        for lu_id, lu_chain_games in linearunlock_games.iteritems():
            lu_chain_games.sort(key=lambda x: x['chainposition'])
            response['game'].extend(lu_chain_games)
        # Then add all other games that are not in any chain
        response['game'].extend(other_games)

        db.session.close()
        return jsonify(response)

    def admin_delete_chal_linearunlocked():
        lu_to_delete = []
        lu_entries = LinearUnlockingEntry.query.filter_by(chalid=request.form['id']).all()
        for entry in lu_entries:
            if entry.linearunlockid not in lu_to_delete:
                lu_to_delete.append(entry.linearunlockid)
                
        for lu_id in lu_to_delete:
            LinearUnlockingEntry.query.filter_by(linearunlockid=lu_id).delete()
            LinearUnlockingModel.query.filter_by(id=lu_id).delete()
            db.session.commit()

        return admin_delete_chal()

    app.view_functions['admin_challenges.admin_delete_chal'] = admin_delete_chal_linearunlocked
    app.view_functions['challenges.chals'] = chals_linearunlocked
    app.view_functions['challenges.chal_view'] = chal_view_linearunlocked