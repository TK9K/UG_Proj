import React, {useEffect, useState} from "react";

import Sidebar from "@/components/Sidebar.jsx";
import Topbar from "@/components/Topbar.jsx";
import {generateShortCode, getFriends, getInitials, getTeamsWithUser} from "@/components/Utility.jsx";

//ShadCN/UI Components
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/src/components/ui/card.jsx";
import {Button} from "@/src/components/ui/button.jsx";
import {Dialog, DialogFooter, DialogHeader, DialogContent, DialogDescription, DialogTrigger, DialogTitle, DialogClose} from "@/src/components/ui/dialog.jsx";
import {Input} from "@/src/components/ui/input.jsx";
import {Label} from "@/src/components/ui/label.jsx";
import {Avatar, AvatarFallback} from "@/src/components/ui/avatar.jsx";
import {Badge} from "@/src/components/ui/badge.jsx";
import {toast} from "sonner";
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/src/components/ui/input-otp.jsx";
import {REGEXP_ONLY_DIGITS_AND_CHARS} from "input-otp";

import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
    arrayUnion,
    and,
} from "firebase/firestore";
import {auth, db} from "@/Firebase.jsx";

import {TrashIcon, ArrowRightSquareIcon, CheckIcon, XIcon} from "lucide-react";

const SocialCircle = () => {
    //Sidebar open/close var
    const [sidebar, setSidebar] = useState(true);

    //Get user id
    const userId = auth.currentUser ? auth.currentUser.uid : null;

    //variables to store new group name and code
    const [groupName, setGroupName] = useState("");
    const [groupShortCode, setGroupShortCode] = useState("");

    //Trigger a component refresh when a new group is created
    const [refreshTeams, setRefreshTeams] = useState(false);

    //Get current groups the user is a part of
    const [teamsWithUser, setTeamsWithUser] = useState([]);

    //Would be used to conditionally render the friends/groups page
    const [socialEnabled, setSocialEnabled] = useState(false);

    //User's shortcode from social collection
    const [userShortCode, setUserShortCode] = useState(null);
    //Used to send a 'friend request' to a specific shortcode
    const [friendShortCode, setFriendShortCode] = useState("");
    //User friends and freind request variables
    const [userRequests, setUserRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    //Trigger component refresh when friend accepted/denied/etc
    const [refreshFriends, setRefreshFriends] = useState(false);

    //Open/close sidebar
    const toggleSidebar = () => {
        setSidebar(!sidebar);
    }

    const createNewGroup = async (teamName, groupOwnerId) => {
        //Get the teams collection from the database / will create collection if there is none
        //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
        const teamsCollection = collection(db, "teams");

        //Callback to shortcode function
        const shortCode = generateShortCode();

        //Current set up of a teams doc, all information is passed to the firestore database after function runs
        const teamData = {
            teamName,
            shortCode,
            members: [{userId: groupOwnerId, displayName: auth.currentUser.displayName }],
            requests: [],
        };

        //Adding the information above to the doc
        await setDoc(doc(teamsCollection), teamData);

        //Refreshes the teams component
        setRefreshTeams((prev) => !prev);

    }

    const joinGroup = async (groupShortCode, userId) => {

        //Standard code to get a specific doc in the teams collection
        //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
        const teamsList = collection(db, "teams");
        //Query -- Google Firebase, “Query and filter data | Firestore,” Google Cloud. https://cloud.google.com/firestore/docs/query-data/queries (accessed Apr. 24, 2024). -- also using firebase's GUI Query Builder
        const teamQuery = query(teamsList, where("shortCode", "==", groupShortCode));
        //Wait for database response before continuing
        const completedQuery = await getDocs(teamQuery);

        //Provided the short code returns an actual team
        if (!completedQuery.empty) {
            //Taking the first doc passed which should always be only one doc
            const selectedTeam = completedQuery.docs[0];
            //Assign data to variable so it can be edited
            const teamData = selectedTeam.data();
            //Adding the joining user to the requests array
            //Check the user request id is in the requests object
            if (!teamData.requests.includes(userId)) {
                //...teamData.requests takes the existing team's requests array and appends it to our 'newRequests' constant so that it can be re-added to the doc
                const newRequests = [...teamData.requests, {userId, displayName: auth.currentUser.displayName}];

                //Setting the requests to our new value
                await setDoc(selectedTeam.ref, {requests: newRequests}, {merge: true});

                //Standard error messages
                console.log(`${userId} requested access to the group`);
            } else {
                console.warn(`${userId} has already requested access`);
            }
        } else {
            console.error("Group not found");
        }
    }

    const updateGroup = async (shortCode, userId, action) => {
        //Standard code to get the appropriate teams collection
        //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
        const groupsList = collection(db, "teams");
        //Query -- Google Firebase, “Query and filter data | Firestore,” Google Cloud. https://cloud.google.com/firestore/docs/query-data/queries (accessed Apr. 24, 2024). -- also using firebase's GUI Query Builder
        const groupQuery = query(groupsList, where("shortCode", "==", shortCode));
        const completedQuery = await getDocs(groupQuery);

        if (!completedQuery.empty) {
            //Select first doc
            const selectedGroup = completedQuery.docs[0];
            //Assign data to variable
            const groupData = selectedGroup.data();

            //Check if user is a member by iterating over the members array (.some returns true if any conditions are true)
            const isCurrentUserMember = groupData.members.some(member => member.userId === userId);

            //Checking if the user is the only member of the team
            if (isCurrentUserMember) {
                const isOnlyMember = groupData.members.length === 1;

                //Can only delete the team if they are the sole member
                if (action === "delete" && isOnlyMember) {
                    //Get document reference and delete
                    await deleteDoc(selectedGroup.ref);
                    setRefreshTeams(prev => !prev);
                    console.log("Group deleted");
                    //Leaving the team can be achieved without being the sole member
                } else if (action === "leave") {
                    //Filter for the user -- remove from updated members
                    const updatedMembers = groupData.members.filter(member => member.userId !== userId);

                    //Set the team to no longer contain the user as a member -- get doc reference and set to updated members
                    await setDoc(selectedGroup.ref, { members: updatedMembers }, { merge: true });
                    setRefreshTeams(prev => !prev);
                    console.log("User left group");
                } else {
                    console.error(`Invalid Action ${action}`)
                }
            } else {
                console.error("User not a member of the group");
            }
        } else {
            console.error("Group not found");
        }
    }

    const approveGroupAccess = async (shortCode, userId) => {
        //Standard code for accessing a specific team doc in the teams collection
        //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
        const teamsList = collection(db, "teams");
        //Query -- Google Firebase, “Query and filter data | Firestore,” Google Cloud. https://cloud.google.com/firestore/docs/query-data/queries (accessed Apr. 24, 2024). -- also using firebase's GUI Query Builder
        const teamQuery = query(teamsList, where("shortCode", "==", shortCode))
        const completedQuery = await getDocs(teamQuery);

        //Checking if the team exists
        if (!completedQuery.empty) {
            //Get first document
            const selectedTeam = completedQuery.docs[0];
            //Assign data to variable
            const teamData = selectedTeam.data();

            //Searching for the user in the specific teams doc request section
            const userApproved = teamData.requests.find((request) => request.userId === userId);

            //If they have approved the user
            if (userApproved) {
                //Declare the two variables from the approved user var above
                const { userId, displayName } = userApproved;
                //Adding that user and their display name to the members array
                const updatedMembers = [ ...teamData.members, { userId, displayName } ];
                //Filtering the requests array to no longer contain the user
                const updatedRequests = teamData.requests.filter((request) => request.userId !== userId);

                //setting the requests section in the doc to the new array
                await setDoc(selectedTeam.ref, { members: updatedMembers, requests: updatedRequests }, { merge: true });

                //Refreshing the teams component
                setRefreshTeams((prev) => !prev);

                //Standard error messages
                console.log(`${userId} approved access`)
            } else {
                console.warn(`${userId} not found in requests`)
            }
        } else {
            console.error("Team not found");
        }
    };

    //Same concept as above just removing the user from the requests section
    const denyGroupAccess = async (shortCode, userId) => {
        //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
        const teamsList = collection(db, "teams");
        //Query -- Google Firebase, “Query and filter data | Firestore,” Google Cloud. https://cloud.google.com/firestore/docs/query-data/queries (accessed Apr. 24, 2024). -- also using firebase's GUI Query Builder
        const teamQuery = query(teamsList, where("shortCode", "==", shortCode));
        const completedQuery = await getDocs(teamQuery);

        if (!completedQuery.empty) {
            //Get first document
            const selectedTeam = completedQuery.docs[0];
            //Assign data to variable
            const teamData = selectedTeam.data();

            //Filter out the user
            const updatedRequests = teamData.requests.filter((request) => request.userId !== userId);

            //Set the doc no longer to contain that user
            await setDoc(selectedTeam.ref, { requests: updatedRequests }, { merge: true });

            //Component update
            setRefreshTeams((prev) => !prev);

            console.log(`${userId} denied access`);
        } else {
            console.error("Team not found")
        }
    };

    const addNewFriend = async (friendShortCode) => {
        //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
        const friendsCollection = collection(db, "friends");

        //Set up a new 'friend' request in the friendsCollection
        const friendData = {
            // Store request in 'friends' collection
            friendId: userId, //User sending request's id
            requestToShortCode: friendShortCode,//ShortCode ^^
            requestFromShortCode: userShortCode,//Current user's shortcode
            friendDisplayName: auth.currentUser.displayName, //User sending request's display name
            status: "pending", //Pending request
        }
        //Add to doc
        await setDoc(doc(friendsCollection), friendData);
    }

    const acceptFriend = async (friendId) => {
        //Move information from 'friends' collection to user's social sub-collection
        //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
        const friendsCollection = collection(db, "friends");
        //Query -- Google Firebase, “Query and filter data | Firestore,” Google Cloud. https://cloud.google.com/firestore/docs/query-data/queries (accessed Apr. 24, 2024). -- also using firebase's GUI Query Builder
        const friendsQuery = query(friendsCollection, where("friendId", "==", friendId));
        const completedQuery = await getDocs(friendsQuery);

        //Logic to move friends
        if (!completedQuery.empty) {
            //select first doc
            const selectedFriend = completedQuery.docs[0];
            //assign doc data to variable
            const friendDocData = selectedFriend.data();

            //create new friend variable
            const friendData = {
                friendId: friendDocData.friendId,//Store id
                friendDisplayName: friendDocData.friendDisplayName,// Store display name
            }
            //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
            const socialCollection = collection(db, "users", userId, "social");
            //Query -- Google Firebase, “Query and filter data | Firestore,” Google Cloud. https://cloud.google.com/firestore/docs/query-data/queries (accessed Apr. 24, 2024). -- also using firebase's GUI Query Builder
            const socialQuery = query(socialCollection, where("shortCode", "==", userShortCode));
            const socialCompletedQuery = await getDocs(socialQuery);

            //Check query isn't empty
            if (!socialCompletedQuery.empty) {
                //Get doc reference to update it
                const socialDoc = socialCompletedQuery.docs[0].ref;

                //Add friend to new array in social collection -- based on code from firestore docs Google Firebase, “Add data to Cloud Firestore | Firebase Documentation,” Firebase.  https://firebase.google.com/docs/firestore/manage-data/add-data#update-data (accessed Apr. 23, 2024).
                await updateDoc(socialDoc, {
                    friends: arrayUnion(friendData)
                });

                await updateDoc(completedQuery.docs[0].ref, {
                    //Set request to accepted
                    status: "accepted",
                    //Provide accepting user's id and displayname
                    responseId: userId,
                    responseDisplayName: auth.currentUser.displayName,
                });

            } else {
                console.error("No doc found by query")
            }

        }
        //Component update
        setRefreshFriends((prev) => !prev);

    }

    const rejectFriend = async (friendId) => {
        //Delete request from Friends collection

        //Standard code to get the appropiate request
        //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
        const friendsCollection = collection(db, "friends");
        //Query -- Google Firebase, “Query and filter data | Firestore,” Google Cloud. https://cloud.google.com/firestore/docs/query-data/queries (accessed Apr. 24, 2024). -- also using firebase's GUI Query Builder
        const friendsQuery = query(friendsCollection, where("friendId", "==", friendId));
        const completedQuery = await getDocs(friendsQuery);

        //Check query exists
        if (!completedQuery.empty) {
            //First request in the query
            const selectedRequest = completedQuery.docs[0];

            //Deleting relevant request
            await deleteDoc(selectedRequest.ref);

            console.log(`Request with friendId: '${friendId}' deleted.`);
        } else {
            console.error("Request not found")
        }
        setRefreshFriends((prev) => !prev);

    }

    const getFriendRequests = async () => {

        try {
            //Standard code taken from profile page to get the users shortcode and set it
            //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
            const socialCollection = collection(db, "users", userId, "social");
            const socialQuery = await getDocs(socialCollection);
            //Get first document and save data in variable
            const socialDoc = socialQuery.docs[0];
            const socialData = socialDoc.data();

            //Check if social collection exists for user
            if (socialQuery.size > 0) {
                //Change whats rendered on the page
                setSocialEnabled(true);
                //Finding the users shortcode and setting it
                setUserShortCode(socialData.shortCode);
                console.log("True")
            } else {
                //Change whats rendered on the page
                setSocialEnabled(false);
            }

            //Finding requests based on shortcode
            //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
            const friendsCollection = collection(db, "friends");
            //Query -- Google Firebase, “Query and filter data | Firestore,” Google Cloud. https://cloud.google.com/firestore/docs/query-data/queries (accessed Apr. 24, 2024). -- also using firebase's GUI Query Builder
            const requestsQuery = query(friendsCollection, where("requestToShortCode", "==", userShortCode));
            const friendsDoc = await getDocs(requestsQuery);

            //Map the friends array onto friendData variable
            const friendsData = friendsDoc.docs.map(doc => doc.data());
            //Set the userRequests array to the mapped array ^
            setUserRequests(friendsData);
            console.log("User SC: ", userShortCode, "friendsData: ", friendsData, "userRequests: ", userRequests);

            //Building a more complex query to refine data to status accepted and the request being from the logged in user shortcode
            const acceptedQuery = query((friendsCollection), and(
                where("status", "==", "accepted"),
                    where("requestFromShortCode", "==", userShortCode)));

            const acceptedDoc = await getDocs(acceptedQuery);

            //Code to move an accepted friend request to the users friends array
            if (!acceptedDoc.empty) {
                console.log("Accepted not empty")
                const acceptedData = acceptedDoc.docs[0].data();
                //Initialising a new friends variable with the friend's id and display name
                const friendData = {
                    friendId: acceptedData.responseId,
                    friendDisplayName: acceptedData.responseDisplayName,
                }

                console.log("accepted data: ", acceptedData, "frienddata: ", friendData);

                //Standard code for accessing the social collection -- Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024).
                //Query -- Google Firebase, “Query and filter data | Firestore,” Google Cloud. https://cloud.google.com/firestore/docs/query-data/queries (accessed Apr. 24, 2024). -- also using firebase's GUI Query Builder
                const acceptedSocialQuery = query(socialCollection, where("shortCode", "==", userShortCode));
                const acceptedSocialCompleted = await getDocs(acceptedSocialQuery);
                const acceptedSocialRef = acceptedSocialCompleted.docs[0].ref;

                // based on code from firestore docs Google Firebase, “Add data to Cloud Firestore | Firebase Documentation,” Firebase.  https://firebase.google.com/docs/firestore/manage-data/add-data#update-data (accessed Apr. 23, 2024).
                await updateDoc(acceptedSocialRef, {
                    //Add the friend data to the array of objects
                    friends: arrayUnion(friendData)
                }).then(
                    //Delete request from the requests section
                    await deleteDoc(acceptedDoc.docs[0].ref)
                );

            }
        } catch (e) {
            console.error("Error in getFriendRequests", e);
        }
    }

    const deleteFriend = async (friendId) => {
        //Delete request from Friends collection
        try {
            //Standard code to get the appropiate request
            //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
            const friendsCollection = collection(db, "users", userId, "social");
            //Query -- Google Firebase, “Query and filter data | Firestore,” Google Cloud. https://cloud.google.com/firestore/docs/query-data/queries (accessed Apr. 24, 2024). -- also using firebase's GUI Query Builder
            const friendsQuery = query(friendsCollection, where("shortCode", "==", userShortCode));
            const friendDoc = await getDocs(friendsQuery);

            //Check query returns a result
            if (!friendDoc.empty) {
                //Get data of first doc
                const friendData = friendDoc.docs[0].data();
                //Get document reference
                const friendRef = friendDoc.docs[0].ref;
                //Assign friends array to var
                const friendsArray = friendData.friends;

                //Filter array for all friends except the friend to be deleted
                const filteredArray = friendData.friends.filter((friend) => friend.friendId !== friendId);

                //Update doc with new list
                await setDoc(friendRef, {friends: filteredArray}, {merge: true});
                console.log("Friends Array: ", friendsArray, "Filtered Array: ", filteredArray);

            }

        } catch (e) {
            console.error("Error deleting friend: ", e)
        }
        //Refresh component
        setRefreshFriends((prev) => !prev);

    }

    useEffect(() => {
        //Get the user's groups
        getTeamsWithUser(userId, setTeamsWithUser, refreshTeams);
    }, [userId, refreshTeams]);

    useEffect(() => {
        //Find Requests to User in Friends collection
        getFriendRequests()
    }, [userShortCode, refreshFriends]);

    useEffect(() => {
        //Get the user's friends
        getFriends(userId, userShortCode, setFriends);
    }, [userShortCode, refreshFriends]);


    return (
        <div className="flex w-full h-screen">
            <nav>
                <Sidebar isOpen={sidebar}/>
            </nav>

            <div className={"w-full"}>
                <header>
                    <Topbar currentPage={"Social Circle"} onToggleSidebar={toggleSidebar}/>
                </header>
                <div className={"grid gap-2 p-2"}>
                    <Card>
                        <CardHeader>
                            <CardTitle className={"text-2xl font-bold"}>Friends</CardTitle>
                            <CardContent className={"pl-0"}>
                                <CardDescription className={"pb-3 pt-1"}>You can add, edit and remove friends from here.</CardDescription>

                                <div className={"grid grid-cols-3 gap-4"}>
                                    <div/>

                                    <div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button className={"w-full"}>Add Friend</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Add a Friend</DialogTitle>
                                                    <DialogDescription>Use your friend's shortcode from their profile
                                                        page to add a new friend.</DialogDescription>
                                                </DialogHeader>
                                                <div className={"grid grid-rows-2"}>
                                                    <Label htmlFor={"groupShortCode"}>Enter the Short Code for your
                                                        Friend Below</Label>
                                                    {/*Code for creating the inputOTP component from ShadCN docs -- ShadCN, “Input OTP,” ui.shadcn.com. https://ui.shadcn.com/docs/components/input-otp (accessed Mar. 09, 2024).*/}
                                                    <InputOTP maxLength={4} className={"flex justify-center"}
                                                              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                                                              value={friendShortCode}
                                                              onChange={(friendShortCode) => setFriendShortCode(friendShortCode)}
                                                              render={({slots}) => (
                                                                  <InputOTPGroup className={"gap-2"}>
                                                                      {slots.map((slot, index) => (
                                                                          <InputOTPSlot key={index} {...slot}
                                                                                        className={"rounded-md border"}/>
                                                                      ))}{" "}
                                                                  </InputOTPGroup>
                                                              )}>
                                                    </InputOTP>
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button className={"w-full"} onClick={() => { addNewFriend(friendShortCode);
                                                            /*Code for creating toasts based on docs -- ShadCN, “Sonner,” ui.shadcn.com. https://ui.shadcn.com/docs/components/sonner (accessed Feb. 28, 2024).*/
                                                            toast("Friend Request sent", {
                                                                description: `Your friend request has been sent to the user with shortcode '${friendShortCode}`
                                                            })}}>Send Friend Request</Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <div />
                                </div>
                            </CardContent>
                        </CardHeader>
                    </Card>
                    <div className={"grid grid-cols-2 gap-4"}>
                        <Card>
                            <CardHeader>
                                <CardTitle className={"text-2xl font-bold"}>Friend List</CardTitle>
                                <CardDescription>Your current friend's list can be seen and edited here.</CardDescription>
                                <CardContent className={"pl-0"}>
                                    {friends ? friends.map((friend, index) => (
                                        <div className={"flex items-center space-x-3"}>
                                            <div className={"p-3"}>
                                                <div className={"flex items-center space-x-3 mb-3"}>
                                                    <div className={"flex items-center flex-grow"}>
                                                        <Avatar>
                                                            <AvatarFallback>{getInitials(friend.friendDisplayName)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className={"p-3"}>
                                                            <p className={"text-sm font-semibold col-span-2 justify-center"}>{friend.friendDisplayName}</p>
                                                        </div>
                                                    </div>
                                                    <div className={"space-x-3"}>
                                                        <Button variant={"outline"} size={"icon"} onClick={() => {
                                                            deleteFriend(friend.friendId);
                                                            //*Code for creating toasts based on docs -- ShadCN, “Sonner,” ui.shadcn.com. https://ui.shadcn.com/docs/components/sonner (accessed Feb. 28, 2024).*/
                                                            toast("Friend Deleted", {
                                                                description: `You have deleted ${friend.friendDisplayName} as a friend.`
                                                            })
                                                        }}>
                                                            <TrashIcon className={"w-3 h-3 text-red-500"}/>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        ""
                                    )}
                                </CardContent>
                            </CardHeader>

                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className={"text-2xl font-bold"}>Requests</CardTitle>
                                <CardDescription>Any pending friend requests will be shown here.</CardDescription>
                                <CardContent className={"pl-0"}>
                                    {userRequests ? userRequests.map((request, index) => (
                                        <div className={"flex items-center space-x-3"}>
                                            <div className={"p-3"}>
                                                <div className={"flex items-center space-x-3 mb-3"}>
                                                    <div className={"flex items-center flex-grow"}>
                                                        <Avatar>
                                                            <AvatarFallback>{getInitials(request.friendDisplayName)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className={"p-3"}>
                                                            <p className={"text-sm font-semibold col-span-2 justify-center"}>{request.friendDisplayName}</p>
                                                        </div>
                                                    </div>
                                                    <div className={"space-x-3"}>
                                                        <Button variant={"outline"} size={"icon"} onClick={() => {
                                                            acceptFriend(request.friendId);
                                                            /*Code for creating toasts based on docs -- ShadCN, “Sonner,” ui.shadcn.com. https://ui.shadcn.com/docs/components/sonner (accessed Feb. 28, 2024).*/
                                                            toast("Request Accepted", {
                                                                description: `You have accepted a friend request from ${request.friendDisplayName}.`
                                                            })
                                                        }}>
                                                            <CheckIcon className={"w-3 h-3 text-green-500"}/>
                                                        </Button>
                                                        <Button variant={"outline"} size={"icon"} onClick={() => {
                                                            rejectFriend(request.friendId);
                                                            /*Code for creating toasts based on docs -- ShadCN, “Sonner,” ui.shadcn.com. https://ui.shadcn.com/docs/components/sonner (accessed Feb. 28, 2024).*/
                                                            toast("Request Denied", {
                                                                description: `You have declined a friend request from ${request.friendDisplayName}.`
                                                            })
                                                        }}>
                                                            <XIcon className={"w-3 h-3 text-red-500"}/>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        ""
                                    )}
                                </CardContent>
                            </CardHeader>

                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className={"text-2xl font-bold"}>Groups</CardTitle>
                            <CardContent className={"pl-0"}>
                                <CardDescription className={"pb-3 pt-1"}>You can create and join groups with friends to complete tasks together and compete against one another.</CardDescription>
                                <div className={"grid grid-cols-4 gap-4"}>
                                    <div />
                                    <div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button className={"w-full"}>Create New Group</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Create a New Group</DialogTitle>
                                                    <DialogDescription>You can create groups with your friends to organise social competitions or collaborate on tasks.</DialogDescription>
                                                </DialogHeader>
                                                <div>
                                                    <Label htmlFor={"groupName"}>Choose a Name for Your New Group</Label>
                                                    <Input id={"groupName"} required placeholder={"Group 1"} type={"text"} value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button className={"w-full"} onClick={() => {createNewGroup(groupName, userId);
                                                            /*Code for creating toasts based on docs -- ShadCN, “Sonner,” ui.shadcn.com. https://ui.shadcn.com/docs/components/sonner (accessed Feb. 28, 2024).*/
                                                            toast("Group successfully created", {
                                                                description: `Group '${groupName}' successfully created`
                                                            })}}>Create Group</Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    <div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant={"warn"} className={"w-full"}>Join Group</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Join an Existing Group</DialogTitle>
                                                    <DialogDescription>You can enter the short code of an existing group below to request access to the group</DialogDescription>
                                                </DialogHeader>
                                                <div className={"grid grid-rows-2"}>
                                                    <Label htmlFor={"groupShortCode"}>Enter the Short Code for the Group Below</Label>
                                                    {/*Code for creating the inputOTP component from ShadCN docs -- ShadCN, “Input OTP,” ui.shadcn.com. https://ui.shadcn.com/docs/components/input-otp (accessed Mar. 09, 2024).*/}
                                                    <InputOTP maxLength={4} className={"flex justify-center"} pattern={REGEXP_ONLY_DIGITS_AND_CHARS} value={groupShortCode} onChange={(groupShortCode) => setGroupShortCode(groupShortCode)} render={({ slots }) => (
                                                        <InputOTPGroup className={"gap-2"}>
                                                            {slots.map((slot, index) => (
                                                                <InputOTPSlot key={index} {...slot} className={"rounded-md border"}/>
                                                            ))}{" "}
                                                        </InputOTPGroup>
                                                    )}>
                                                    </InputOTP>
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button className={"w-full"} onClick={() => {joinGroup(groupShortCode, userId);
                                                            /*Code for creating toasts based on docs -- ShadCN, “Sonner,” ui.shadcn.com. https://ui.shadcn.com/docs/components/sonner (accessed Feb. 28, 2024).*/
                                                            toast("Request to join group has been sent", {
                                                                description: `Your request to join the group ('${groupShortCode}') has been sent`
                                                            })}}>Request Access to Group</Button>
                                                    </DialogClose>

                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                    </div>

                                    <div />
                                </div>
                            </CardContent>
                        </CardHeader>
                    </Card>
                    <div className={"grid lg:grid-cols-3 gap-4 sm:grid-cols-2"}>
                        {teamsWithUser && teamsWithUser.map((team, index) => (
                            <div>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className={"grid grid-cols-10"}>
                                            <div className={"col-span-9 text-lg font-bold"}>{team.teamName}</div>
                                            <div>
                                                {team.members.length > 1 ? (
                                                    <Button className={"col-span-1"} variant={"outline"} size={"icon"} onClick={() => {updateGroup(team.shortCode, userId, "leave");
                                                        /*Code for creating toasts based on docs -- ShadCN, “Sonner,” ui.shadcn.com. https://ui.shadcn.com/docs/components/sonner (accessed Feb. 28, 2024).*/
                                                        toast("Left Group Successfully", {
                                                            description: `You have left the group '${team.teamName}'`
                                                        })} }>
                                                        <ArrowRightSquareIcon className={"w-4 h-4 text-amber-300"} />
                                                    </Button>
                                                ) : (
                                                    <Button className={"col-span-1"} variant={"outline"} size={"icon"} onClick={() => {updateGroup(team.shortCode, userId, "delete");
                                                        /*Code for creating toasts based on docs -- ShadCN, “Sonner,” ui.shadcn.com. https://ui.shadcn.com/docs/components/sonner (accessed Feb. 28, 2024).*/
                                                        toast("Deleted Group Successfully", {
                                                            description: `Group ${team.teamName} has been successfully deleted`
                                                        })} }>
                                                        <TrashIcon className={"w-4 h-4 text-red-500"}/>
                                                    </Button>
                                                )}

                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className={"mb-3"}>Short Code: <b>{team.shortCode}</b></CardDescription>
                                        {team.members.map((member) => (
                                            <div className={"flex items-center space-x-3"}>
                                                <Avatar>
                                                    <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                                                </Avatar>
                                                <div className={"p-3"}>
                                                    {member.userId && member.userId === auth.currentUser.uid ? (
                                                        <div>
                                                            <p className={"text-sm font-semibold"}>{member.displayName}</p>
                                                            <Badge>You</Badge>
                                                        </div>
                                                    ) : (
                                                        <div className={"flex items-center justify-between"}>
                                                            <p className={"text-sm font-semibold pr-3"}>{member.displayName}</p>
                                                            <Button variant={"outline"} size={"icon"} onClick={() => { {/*TODO Remove user functionality*/}
                                                                /*Code for creating toasts based on docs -- ShadCN, “Sonner,” ui.shadcn.com. https://ui.shadcn.com/docs/components/sonner (accessed Feb. 28, 2024).*/
                                                                toast("User Removed Successfully", {
                                                                    description: `${member.displayName} has been successfully removed`
                                                                })} }>
                                                                <TrashIcon className={"w-4 h-4 text-red-500"}/>
                                                            </Button>
                                                        </div>

                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {team.requests && team.requests.length > 0 ? (
                                            <div className={"pt-3"}>
                                                <hr className={"pb-3"}/>
                                                <h5 className={"pb-3"}>Pending Requests:</h5>
                                                {team.requests.map((request) => (
                                                    <div key={request.userId} className={"flex items-center space-x-3 mb-3"}>
                                                        <div className={"flex items-center flex-grow"}>
                                                            <Avatar>
                                                                <AvatarFallback>{getInitials(request.displayName)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className={"p-3"}>
                                                                <p className={"text-sm font-semibold col-span-2 justify-center"}>{request.displayName}</p>
                                                            </div>
                                                        </div>
                                                        <div className={"space-x-3"}>
                                                            <Button variant={"outline"} size={"icon"} onClick={() => {approveGroupAccess(team.shortCode, request.userId);
                                                                /*Code for creating toasts based on docs -- ShadCN, “Sonner,” ui.shadcn.com. https://ui.shadcn.com/docs/components/sonner (accessed Feb. 28, 2024).*/
                                                                toast("Approved Access to Group", {
                                                                description: `Access to user ${request.displayName} has been approved.`
                                                            })}}>
                                                                <CheckIcon className={"w-2 h-2 text-green-500"}/>
                                                            </Button>
                                                            <Button variant={"outline"} size={"icon"} onClick={() => {denyGroupAccess(team.shortCode, request.userId);
                                                                /*Code for creating toasts based on docs -- ShadCN, “Sonner,” ui.shadcn.com. https://ui.shadcn.com/docs/components/sonner (accessed Feb. 28, 2024).*/
                                                                toast("Denied Access to Group", {
                                                                description: `Access to user ${request.displayName} has been denied.`
                                                            })}}>
                                                                <XIcon className={"w-2 h-2 text-red-500"}/>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            ""
                                        )}

                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                        <div />
                    </div>
                </div>

            </div>
        </div>
    )
}

export default SocialCircle;