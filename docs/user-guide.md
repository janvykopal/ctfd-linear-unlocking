# User Guide 

> **Chain:** <br> 
We define chain as a list of challenges that must be solved in order. 
Each chain must be linear (has only one path) and no challenge can exist more than once across all chains.
A chain cannot contain challenges of different challenge categories.

> **Locked challenges:** <br> 
Locked challenges are disabled for a user when the user has yet to solve the previous challenge in the chain.
A challenge is said to be unlocked for a user when it can be attempted by him.

## As an Admin

To configure challenges using this plugin: `CTFd` -> `Admin` -> `Plugins` -> `Linear Unlocking`

> The admin system is guarded at the web interface using JavaScript, and not guarded at the backend. 
Admins should not tamper with the code on his web browser as it may cause undesirable behaviors.

### Create a new chain

You can create a new chain to require challenges to be solved in a specific order for all users.

1. Under "Create new chain", select the challenge category.
1. Select the challenges to be unlocked in order. The first challenge is always unlocked and the subsequent challenges are locked until its previous challenge is solved.
1. To add more challenges into the chain, click `Add Another Succeeding Challenge`.
1. Click `Create`.

### Hide locked challenges

You can hide locked challenges in a chain from the user completely instead of graying out the buttons.

1. Under "Existing chains", tick the checkbox `Hide locked challenges` of the chain you would like to hide.

### Delete an existing chain

You can delete an existing chain to remove the chain constraints.

1. Under "Existing chains", click `Delete` of the chain you would like to delete.

### Deleting a challenge

When you delete a challenge that exists in a chain, the chain constraint will automatically be removed.

## As a User

> Locked challenges are guarded both at the web interface and backend by this plugin. 
Users should not be able to bypass constraints (such as viewing locked challenges) set by the admin by modifying his web browser.

### Locked challenges

At the Challenges page, locked challenges are grayed out (or hidden). 
You will not be able to view or attempt the challenge until the previous challenge in the chain is solved.

### Challenge ordering

At the Challenges page, challenges in a chain are always listed first within its challenge category, and sorted by the unlocking order of the challenges.