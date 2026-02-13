import {collection, getDocs, query, where} from "firebase/firestore";
import {db} from "../Firebase";

import {isToday, isTomorrow, isYesterday} from "date-fns";

//The basis for which i set up my utility function is based on -- (StackOverflow and 'Fangming', “Correct way to share functions between components in React,” Stack Overflow, Jan. 17, 2023. https://stackoverflow.com/questions/32888728/correct-way-to-share-functions-between-components-in-react (accessed Jan. 17, 2024).)

// Used to pull the teams from the firestore database then filter by only those with the auth user's current id
export const getTeamsWithUser = async (userId, setTeamsWithUser) => {
    if (userId) {
        //${member.displayName} ${member.userId} <-- DISPLAY NAME AND USER ID CAN BE ACCESSED HERE
        //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
        const teamsList = collection(db, "teams");

        const completedUserTeam = await getDocs(teamsList);

        //Map user 'teams/groups' onto team data array
        const teamsData = completedUserTeam.docs.map((doc) => ({ id: doc.id, ...doc.data()}));

        const parsedTeamsData = teamsData.map((teamDoc) => {
            //Elipsis operator to spread the data of each team
            const team = { ...teamDoc };
            //Map a member into their id and display name so each can be accessed individually
            team.membersData = team.members.map(member => member.displayName);
            return team;
            //Filter all the teams returned for only those with the current user id as part of them
        }).filter((team) => team.members.some((member) => member.userId === userId));

        //Set teams data
        setTeamsWithUser(parsedTeamsData);

    }
};

//Code used to format and tidy up the dates set in tasks, will return a more simple yesterday/today/tomorrow if appropriate
export const formatDate = (dateString) => {
    //Specifying how the date is formatted for use by Intl.DateTimeFormat
    const options = { day: "numeric", month: "long", year: "numeric" };

    //Defining the data variable
    let date;

    //Setting the date passed iin to be an instance of the Javascript Date object -- (StackOverflow and L. Liesis, “How to check whether an object is a date?,” Stack Overflow, Nov. 24, 2016. https://stackoverflow.com/questions/643782/how-to-check-whether-an-object-is-a-date (accessed Jan. 23, 2024).)
    if (dateString instanceof Date) {
        date = dateString;
    } else if (dateString) {
        date = dateString.toDate();
    } else {
        date = null;
    }

    //Comparisons for checking if the value of the date is one of the predefined date -- simplified function using Date-FNS library (Date-FNS, “Modern JavaScript Date Utility Library,” date-fns.org. https://date-fns.org/v3.6.0/docs/ (accessed May 01, 2024).)
    const todayTest = isToday(date); //https://date-fns.org/v3.6.0/docs/isToday
    const tomorrowTest = isTomorrow(date); //https://date-fns.org/v3.6.0/docs/isTomorrow
    const yesterdayTest = isYesterday(date); //https://date-fns.org/v3.6.0/docs/isYesterday

    //Formatting the date
    if (todayTest) {
        return "Today";
    } else if (tomorrowTest) {
        return "Tomorrow";
    } else if (yesterdayTest) {
        return "Yesterday";
    } else {
        //Set date locale to be in the traditional form day month year -- (Mozilla, “Intl.DateTimeFormat - JavaScript | MDN,” developer.mozilla.org. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat (accessed Jan. 23, 2024).)
        return new Intl.DateTimeFormat("en-GB", options).format(date);
    }
}

export const getInitials = (displayName) => {

    //Split the displayName by the space
    const displayNameSplit = displayName.split(" ");

    //Get the first character of the first name and first of the last name, combine and return
    return displayNameSplit[0].charAt(0) + displayNameSplit[1].charAt(0);

}

export const generateShortCode = () => {
    //Code based on -- (StackOverflow and P. A, “Generate random string/characters in JavaScript,” Stack Overflow, Oct. 17, 2022. https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript (accessed Jan. 01, 2024).)
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let shortCode = "";

    //Take 4 of the above characters and combine to generate a random shortcode
    for (let i = 0; i < 4; i++) {
        shortCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return shortCode;
};

export const getFriends = async (userId, userShortCode, setFriends) => {
    try {
        //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
        const friendsCollection = collection(db, "users", userId, "social");
        //Query -- Google Firebase, “Query and filter data | Firestore,” Google Cloud. https://cloud.google.com/firestore/docs/query-data/queries (accessed Apr. 24, 2024). -- also using firebase's GUI Query Builder
        const friendsQuery = query(friendsCollection, where("shortCode", "==", userShortCode));
        const friendDoc = await getDocs(friendsQuery);


        if (!friendDoc.empty) {
            //Get first doc
            const friendData = friendDoc.docs[0].data();
            //Assign friends to variable
            const friendsArray = friendData.friends;

            //Set user's friends
            setFriends(friendsArray);
            console.log("Friends set: ", friendsArray);
        }
    } catch (e) {
        console.error("Error trying to get freinds: ", e);

    }
}

export const getUserShortCode = async (userId, setUserShortCode) => {
    try {
        //Standard code taken from profile page to get the users shortcode and set it
        //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
        const socialCollection = collection(db, "users", userId, "social");
        const socialQuery = await getDocs(socialCollection);
        //select first document and get data
        const socialDoc = socialQuery.docs[0];
        const socialData = socialDoc.data();

        //Check if social collection exists for user
        if (socialQuery.size > 0) {
            //Finding the users shortcode and setting it
            setUserShortCode(socialData.shortCode);
        } else {
            console.log("Social not enabled.")
        }
    } catch (e) {
        console.error("Error getting shortcode: ", e);
    }
}