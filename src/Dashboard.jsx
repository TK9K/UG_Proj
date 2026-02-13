import React, {useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";

//Components & functions
import Sidebar from "@/components/Sidebar.jsx";
import Topbar from "@/components/Topbar.jsx";
import {getFriends, getUserShortCode} from "@/components/Utility.jsx";
import {getWeekPoints} from "@/components/Points.jsx";

//ShadCN UI Components & Recharts library for plotting the chart
import {Card, CardTitle, CardContent, CardDescription, CardHeader} from "@/src/components/ui/card.jsx";
import {Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis} from "recharts";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/src/components/ui/table.jsx";
import {Button} from "@/src/components/ui/button.jsx";

import {getAuth} from "firebase/auth";
import {db} from "@/Firebase.jsx";
import {collection, getDocs, query, orderBy} from "firebase/firestore";

import {format} from "date-fns";

function Dashboard() {
    //Open/close sidebar var
    const [sidebar, setSidebar] = useState(true);

    //User's weekly points
    const [userPoints, setUserPoints] = useState(0);

    //Get userid
    const auth = getAuth();
    const userId = auth.currentUser ? auth.currentUser.uid : null;

    //Store user shortcode
    const [userShortCode, setUserShortCode] = useState("");

    //Store user friends
    const [friends, setFriends] = useState([]);

    const [friendsWithPoints, setFriendsWithPoints] = useState([]);

    //Array of weekly points for chart
    const [barPoints, setBarPoints] = useState([]);

    //Prevent an error with the page not loading if the users don't yet have friends set up
    const [socialEnabled, setSocialEnabled] = useState(false);

    //Array of users to map to the leaderboard
    const [leaderboardPlayers, setLeaderboardPlayers] = useState([]);
    //Prevent the attempt to create a full list of players until the user's friends points have been retrieved
    const [friendPointsRetrieved, setFriendPointsRetrieved] = useState(false);

    const navigate = useNavigate();

    //Open close sidebar
    const toggleSidebar = () => {
        setSidebar(!sidebar);
    }

    const getFriendPoints = async (friendsArray) => {
        console.log("Friends before: ", friendsArray);
        try {
            //Only run the code if the user has friends
            if (friends.length > 0) {
                //For each friend in the array get their weekly points
                const friendPointsArrayQuery = friendsArray.map(friend => getWeekPoints(new Date(), friend.friendId));

                // Wait for promises to complete -- (GeeksForGeeks, “How to wait for multiple Promises in JavaScript ?,” GeeksforGeeks, Nov. 09, 2023. https://www.geeksforgeeks.org/how-to-wait-for-multiple-promises-in-javascript/ (accessed Apr. 28, 2024).)
                const friendsPointsArray = await Promise.all(friendPointsArrayQuery);
                setFriendPointsRetrieved(true);

                //Assinging points to each friend from the above array
                return friendsArray.map((friend, index) => ({
                    //Keep existing friend information
                    ...friend,
                    //Add points to each friend element in array
                    points: friendsPointsArray[index],
                }));
            }
        } catch (e) {
            console.error("Error assigning points to friends",e);
        }
    }

    const generateBars = async () => {
        try {
            //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection - initialise collection
            const weeklyPointsCollection = collection(db, "users", userId, "weeklyPoints");
            //Query -- Google Firebase, “Query and filter data | Firestore,” Google Cloud. https://cloud.google.com/firestore/docs/query-data/queries (accessed Apr. 24, 2024). -- also using firebase's GUI Query Builder
            // order the bars by start date ascending -- Google Firebase, “Order and limit data | Firestore,” Google Cloud. https://cloud.google.com/firestore/docs/query-data/order-limit-data (accessed Apr. 28, 2024).
            const weeklyPointsQuery = query(weeklyPointsCollection, orderBy("startDate", "asc"));
            const weeklyPointsDoc = await getDocs(weeklyPointsQuery);

            console.log("WP Collection: ", weeklyPointsCollection, "WP Docs: ", weeklyPointsDoc);

            const bars = weeklyPointsDoc.docs.map(doc => ({
                //formatting of dates - Date-FNS, “Modern JavaScript Date Utility Library,” date-fns.org. https://date-fns.org/v3.6.0/docs/format (accessed Apr. 28, 2024).
                startDate: format(doc.data().startDate.toDate(), "dd/MM"),
                endDate: format(doc.data().endDate.toDate(), "dd/MM"),
                //Get week points
                points: doc.data().points,
            }))

            //Set up of bars with name and total based on an example -- Kiranism', “next-shadcn-dashboard-starter/components/overview.tsx at main · Kiranism/next-shadcn-dashboard-starter,” GitHub, Nov. 03, 2023. https://github.com/Kiranism/next-shadcn-dashboard-starter/blob/main/components/overview.tsx (accessed Apr. 28, 2024).
            const formattedBars = bars.map((bar) => ({
                //Formatting the name of each bar
                name: `${bar.startDate} - ${bar.endDate}`,
                //Assigning points as the total
                total: bar.points,
            }));
            console.log("Formatted: ", formattedBars)
            //Set the barPoints array to the formatted bars
            setBarPoints(formattedBars);

            console.log("Bar chart Points: ", bars);
        } catch (e) {
            console.error("Error getting weekly points", e);
        }
    }

    const checkSocialEnabled = async () => {
        try {
            //Standard code taken from profile page to get the users shortcode and set it
            //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection - initialise collection
            const socialCollection = collection(db, "users", userId, "social");
            const socialQuery = await getDocs(socialCollection);

            //Change what's rendered on the page depending on whether or not the user has set up the 'social' document
            if (socialQuery.size > 0) {
                setSocialEnabled(true);
            } else {
                setSocialEnabled(false);
            }
        } catch (e) {
            console.error("Error checking social enabled: ", e)
        }
    }

    const orderLeaderboardPlayers = () => {
            //Want in the format of id, name, points

            //Empty array to map all user and friend objects to
            let unordered = [];

            //Creating an object to store user information
            let userObject = {
                id: userId,
                name: auth.currentUser.displayName,
                points: userPoints,
            }

            //Pushing objects to the unordered array
            unordered.push(userObject);

            //Object to store friends information
            friendsWithPoints.forEach((friend) => {
                let friendObject = {
                    id: friend.friendId,
                    name: friend.friendDisplayName,
                    points: friend.points,
                }
                //Pushing objects to the unordered array
                unordered.push(friendObject);
            })

            // Leaderboard sorting function -- K. Joshi, “How to Sort an Array of Objects by Property Name in JavaScript,” freeCodeCamp.org, Jan. 29, 2024. https://www.freecodecamp.org/news/how-to-sort-array-of-objects-by-property-name-in-javascript/ (accessed May 02, 2024).
            let sorted = unordered.sort((a,b) => b.points - a.points);

            //Setting the leaderboard array to be used in generating the leaderboard table
            setLeaderboardPlayers(sorted);
        }

    useEffect(() => {
        const getUserPoints = async () => {
            const points = await getWeekPoints(new Date(), userId)
            setUserPoints(points);
        }
        getUserPoints();
    }, [userId]);

    useEffect(() => {
        getUserShortCode(userId, setUserShortCode);
    }, [userShortCode]);

    useEffect(() => {
        getFriends(userId, userShortCode, setFriends)
    }, [userShortCode]);

    useEffect(() => {
        const getUserFriendPoints = async () => {
            const friendsPoints = await getFriendPoints(friends);
            setFriendsWithPoints(friendsPoints)

            console.log("get friend points: ", friendsPoints);
        }
        getUserFriendPoints();

    }, [friends]);

    useEffect(() => {
        generateBars();
    }, [userId]);

    useEffect(() => {
        checkSocialEnabled()
    }, [userId]);

    useEffect(() => {
        //Wait for the user's friend points to be retrived before continuing
        if (friendPointsRetrieved) {
            orderLeaderboardPlayers()
        }
    }, [friendsWithPoints, userId]);

    return (
        <div className={"flex w-full h-screen"}>
            <nav>
                <Sidebar isOpen={sidebar} />
            </nav>
            <div className={"w-full"}>
                <header>
                    <Topbar currentPage={"Dashboard"} onToggleSidebar={toggleSidebar} />
                </header>
                    <div className={"grid gap-2 grid-cols-1 p-4"}>
                        <Card>
                            <CardHeader className={"space-y-1 grid grid-cols-2"}>
                                <div>
                                    <CardTitle className={"text-2xl font-bold"}>Dashboard</CardTitle>
                                    <CardDescription>The amount of points you earned by week can be seen below.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className={"grid grid-cols-1 grid-rows-2 gap-2 mb-3"}>
                                    <Card className={"text-center"}>
                                        <CardHeader>
                                            <CardTitle className={"text-2xl font-semibold"}>Weekly Points</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {/*Chart based on an example from ShadCN -- Kiranism', “next-shadcn-dashboard-starter/components/overview.tsx at main · Kiranism/next-shadcn-dashboard-starter,” GitHub, Nov. 03, 2023. https://github.com/Kiranism/next-shadcn-dashboard-starter/blob/main/components/overview.tsx (accessed Apr. 28, 2024).*/}
                                            <ResponsiveContainer width={"100%"} height={300}>
                                                <BarChart data={barPoints}>
                                                    <XAxis dataKey="name" stroke={"#000"} fontSize={12} />
                                                    <YAxis stroke={"#000"} fontSize={12} tickFormatter={(value) => `${value}`}/>
                                                    <Bar dataKey={"total"} fill={"#000"} radius={[4, 4, 0, 0]}>
                                                        {/*Adding labels to bar chart -- Recharts, “LabelList,” Recharts. https://recharts.org/en-US/api/LabelList (accessed Apr. 27, 2024).*/}
                                                        <LabelList dataKey={"total"} position={"center"} />
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        {!socialEnabled ? (
                                            <div>
                                                <CardHeader>
                                                    <CardTitle className={"text-2xl font-semibold"}>Friends Leaderboard</CardTitle>
                                                    <CardDescription>To enable the friends leaderboard you need to enable social integration on the profile page</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className={"text-center"}>
                                                        <Button className={"w-1/2"} onClick={() => {navigate("/profile")}}>Go to Profile Page</Button>
                                                    </div>
                                                </CardContent>
                                            </div>
                                        ) : (
                                            <div>
                                                <CardHeader>
                                                    <CardTitle className={"text-2xl font-semibold"}>Friends Leaderboard</CardTitle>
                                                    <CardDescription>The leaderboard shows your progress against friends this week.</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    {/*Basic table concept -- ShadCN, “Table,” ui.shadcn.com. https://ui.shadcn.com/docs/components/table (accessed Apr. 19, 2024).*/}
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Friend's Name</TableHead>
                                                                <TableHead>Points</TableHead>
                                                                <TableHead className={"text-right"}>Position</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {leaderboardPlayers && leaderboardPlayers.map((user, index) => (
                                                                <TableRow key={user.id}>
                                                                    <TableCell className={"font-semibold"}>{user.name} {user.id === userId ? "(You)" : ""}</TableCell>
                                                                    <TableCell>{user.points}</TableCell>
                                                                    <TableCell className={"text-right"}>{index+1}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </CardContent>
                                            </div>
                                        )}
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
            </div>
        </div>
    )
}
export default Dashboard;