# User Guide: 

Adds the capability to require challenges to be solved in a specific order.

> **Chain:** <br> 
We define chain as a list of challenges that must be solved in order. 
Each chain must be linear (has only one path) and no challenge can exist more than once across all chains.
A chain cannot contain challenges of different challenge categories.

> **Locked challenges:** <br> 
Locked challenges are disabled for a user when the user has yet to solve the previous challenge in the chain.
A challenge is said to be unlocked for a user when it can be attempted by him.

## As an Admin

To configure challenges using this plugin: `CTFd` -> `Admin` -> `Plugins` -> `Linear Unlocking`

> The admin system is guarded in the web interface using JavaScript, and not guarded in the backend. 
Admins should not tamper with the code on his web browser as it may cause undesirable behaviors.

### Create a new chain

You can create a new chain.

1. Under `Create new chain`, select the challenge category.
1. Select the challenges to be unlocked in order. The first challenge is always unlocked and the subsequent challenges are locked until the one before is solved.
1. To add more challenges into the chain, click `Add Another Succeeding Challenge`.
1. Click `Create`.

### Hide locked challenges

You can hide locked challenges in a chain from the user completely instead of graying out the buttons.

1. Under `Existing chains`, tick the checkbox `Hide locked challenges` of the chain you would like to hide.

### Delete an existing chain

You can delete an existing chain and remove the locked challenge constraints.

1. Under `Existing chains`, click `Delete` of the chain you would like to delete.

### Deleting a challenge

When you delete a challenge that exists in a chain, the chain will automatically be deleted.

## As a User

To access challenges: `CTFd` -> `Challenges`

> Challenges are guarded both in the web interface and backend by this plugin. 
Users should not be able to bypass constraints set by the admin by modifying his web browser, such as accessing locked challenges.

### Chains

Challenges in a chain are always listed first within its challenge category, and sorted by the unlocking order of the challenges.

### Locked challenges

Locked challenges are grayed out (or hidden). You will not be able to view or attempt the challenge until the previous challenge in the chain is solved.