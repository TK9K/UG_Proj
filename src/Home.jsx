import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";

import Sidebar from "@/components/Sidebar.jsx";
import Topbar from "@/components/Topbar.jsx";
import {formatDate} from "@/components/Utility.jsx";
import {addPointsToWeek, getWeekPoints, storeWeek} from "@/components/Points.jsx";

import {getAuth} from "firebase/auth";
import {collection, deleteDoc, doc, getDoc, getDocs, updateDoc} from "firebase/firestore";
import {db} from "@/Firebase.jsx";

//ShadCN/UI Components
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/src/components/ui/card.jsx";
import {toast} from "sonner";
import {Checkbox} from "@/src/components/ui/checkbox.jsx";
import {Alert, AlertDescription, AlertTitle} from "@/src/components/ui/alert.jsx";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "@/src/components/ui/carousel.jsx";
import Autoplay from "embla-carousel-autoplay";
import {Accordion, AccordionTrigger, AccordionItem, AccordionContent} from "@/src/components/ui/accordion.jsx";
import { Button } from "@/src/components/ui/button"

import {TrashIcon, CalendarDaysIcon, MedalIcon, Users, Smile, Trophy, PencilIcon} from "lucide-react";
import {ExclamationTriangleIcon, PlusIcon} from "@radix-ui/react-icons";

function Home() {
    const [sidebar, setSidebar] = useState(true);
    // Initial declaration of the tasks array
    const [tasks, setTasks] = useState([]);

    // Variables for cards at the top of the page
    const [tasksDueToday, setTasksDueToday] = useState(0);
    const [overdue, setOverdue] = useState(0);
    const [completed, setCompleted] = useState(0);
    const [weekPoints, setWeekPoints] = useState("!");

    //Creating week in database if one doesn't already exist
    const [weekExists, setWeekExists] = useState(false);

    //Getting userId for user
    const auth = getAuth();
    const userId = auth.currentUser ? auth.currentUser.uid : null;

    //Navigate variable to move user between pages
    const navigate = useNavigate();

    //Open/close sidebar
    const toggleSidebar = () => {
        setSidebar(!sidebar);
    }

    // Retrives the user's tasks from firestore database
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                //Standard code for getting the user's tasks from the 'users' collection (Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024).)
                const tasksCollection = collection(db, "users", auth.currentUser.uid, "tasks");
                //Getting all the tasks from the collection
                const tasks = await getDocs(tasksCollection);
                //Setting initial list of tasks to an empty array
                const taskList = [];

                //For each of the tasks in the users --> tasks doc push to the task array
                tasks.forEach((doc) => {
                    taskList.push({...doc.data(), id: doc.id});
                });

                setTasks(taskList);

                console.log("Tasks: ", taskList);

            } catch (error) {
                console.error("Error getting tasks", error);
            }
        };

        fetchTasks();

        //userID as a dependency as its needed to get the collection
    }, [userId]);

    useEffect(() => {
        var tasksTodayCount = 0;
        var overdueCount = 0;
        var completedCount = 0;

        tasks.forEach((task) => {
            //Get task due date
            const dueDate = task.dueDate.toDate();
            //Current date for comparison
            const currentDate = new Date();
            //Boolean for task checked
            const completionState = task.completed;

            //Update task count due today
            if (dueDate.toDateString() === currentDate.toDateString() && completionState !== true) {
                tasksTodayCount++;
                //Update overdue tasks
            } else if (dueDate < currentDate && completionState !== true) {
                overdueCount++;
            }

            //Update completion count
            if (completionState) {
                completedCount++;
            }

        })

        //Set all variables
        setTasksDueToday(tasksTodayCount);
        setOverdue(overdueCount);
        setCompleted(completedCount);
        //Tasks need to be loaded before calculating counts
    }, [tasks]);

    useEffect(() => {
        //Ensure current week exists for points storage -- This runs twice (temp fix by deleting second)
       const checkWeek = async () => {
           //Call storeWeek function in Points.jsx -- check the week exists or create a new one
            const weekExists = await storeWeek(userId, new Date());

            //Retrieve current week points
            setWeekPoints(await getWeekPoints(new Date(), userId));

            //Set week to exists
            setWeekExists(weekExists);
       };

       checkWeek();
    }, []);

    //Code to handle deleting the task from the local storage array, now using the task ID to do so
    const deleteTask = async (id) => {
        try {
            //Get specific doc from datebase with id passed -- Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024).
            const task = doc(db, "users", userId, "tasks", id);

            //Delete task
            await deleteDoc(task);

            //Set local task storage to remove task with id
            const updatedTasks = tasks.filter((task) => task.id !== id);
            setTasks(updatedTasks);
        } catch (e) {
            console.log("Error deleting task: ", e);
        }
    }

    const toggleCompletion = async (id) => {
        try {
            //Setting the task to completed in the local array
            const updatedTasks = tasks.map((task) =>
                task.id === id ? { ...task, completed: !task.completed } : task,
            );

            setTasks(updatedTasks);

            //Searching the database for the specific task with the passed id and awaiting a database response -- Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024).
            const taskList = doc(db, "users", userId, "tasks", id);

            //Getting the specific task
            const task = await getDoc(taskList);

            const taskData = task.data();

            //Setting the status of the completed attribute in the doc - based on code from firestore docs Google Firebase, “Add data to Cloud Firestore | Firebase Documentation,” Firebase.  https://firebase.google.com/docs/firestore/manage-data/add-data#update-data (accessed Apr. 23, 2024).
            await updateDoc(taskList, {
                //Flip boolean state of task
                completed: !taskData.completed,
            });

            if (!taskData.completed) {
                //Get the total task points value
                let taskPoints = taskData.points;
                //Add the points to the current week
                addPointsToWeek(new Date, userId, taskPoints);
                //Manually updating local point count
                setWeekPoints(weekPoints+taskPoints);
            } else {
                //Getting total point val and making it negative
                let taskPoints = -taskData.points;
                //Add points to current week
                addPointsToWeek(new Date, userId, taskPoints);
                //Update local point value
                setWeekPoints(weekPoints+taskPoints);
            }

        } catch (error) {
            console.error("Error updating completion status", error);

            //Flipping local checked status back if there's an error
            const taskCheckError = tasks.map((task) =>
                //If task id == the id passed to delete flip task.completed or leave task as is
                task.id === id ? { ...task, completed: !task.completed } : task
            );
            setTasks(taskCheckError);
        }
    };

    return (
        <div className="flex w-full h-screen">
            <nav>
                <Sidebar isOpen={sidebar} />
            </nav>

            <div className={"w-full"}>
                <header>
                    <Topbar currentPage={"Home"} onToggleSidebar={toggleSidebar}/>
                </header>
                    <div className={"grid gap-2 grid-cols-1 p-4"}>
                        {/*Active Projects Overview*/}
                        <Card>
                            <CardHeader className={"space-y-1 grid grid-cols-2"}>
                                <div>
                                    <CardTitle className={"text-2xl font-bold"}>Active Tasks</CardTitle>
                                    <CardDescription>Your Current Active Tasks are Displayed Below</CardDescription>
                                </div>
                                <div className={"flex justify-end mt-3"}>
                                    <Button className={"ml-auto rounded-full bg-slate-950"} size={"icon"} onClick={() => navigate("/addReminder")}>
                                        <PlusIcon className={"h-4 w-4"}/>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className={"grid grid-cols-2 grid-rows-2 gap-2 mb-3"}>
                                    <div>
                                        <Card className={"text-center"}>
                                            <CardHeader className={"space-y-1"}>
                                                <CardTitle className={"text-6xl font-bold"}>{completed}</CardTitle>
                                            </CardHeader>
                                            <CardContent className={"text-lg"}>
                                                Completed
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div>
                                        <Card className={"text-center"}>
                                            <CardHeader className={"space-y-1"}>
                                                <CardTitle className={"text-6xl font-bold"}>{tasksDueToday}</CardTitle>
                                            </CardHeader>
                                            <CardContent className={"text-lg"}>
                                                Today
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div>
                                        <Card className={"text-center"}>
                                            <CardHeader className={"space-y-1"}>
                                                <CardTitle className={"text-6xl font-bold"}>{weekPoints}</CardTitle>
                                            </CardHeader>
                                            <CardContent className={"text-lg"}>
                                                Points Earned this Week
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div>
                                        <Card className={"text-center"}>
                                            <CardHeader className={"space-y-1"}>
                                                <CardTitle className={"text-6xl font-bold"}>{overdue}</CardTitle>
                                            </CardHeader>
                                            <CardContent className={"text-lg"}>
                                                Overdue
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                                <div>
                                    {/*TODO Just an example but want to generate something like this automatically with a variety of notifications...
                                    TODO Conditionally render these and create appropriate functions for them to work*/}
                                    {/*Carousel autoplay plugin based on -- https://ui.shadcn.com/docs/components/carousel*/}
                                    {/*<Carousel opts={{loop: true}} plugins={[Autoplay({delay: 20000})]} className={"flex items-center"}>
                                        <CarouselContent>
                                            <CarouselItem className={"flex items-center"}>
                                                <div className={"mt-4 mb-4 w-full"}>
                                                    <Alert>
                                                        <CalendarDaysIcon className={"h-4 w-4"}/>
                                                        <AlertTitle>Task Due Soon</AlertTitle>
                                                        <AlertDescription>(TASK TITLE) is due on (TASK DUE DATE). (N) days left to complete this and earn points.</AlertDescription>
                                                    </Alert>
                                                </div>
                                            </CarouselItem>
                                            <CarouselItem className={"flex items-center"}>
                                                <div className={"mt-4 mb-4 w-full"}>
                                                    <Alert>
                                                        <Users className={"h-4 w-4"}/>
                                                        <AlertTitle>Friends</AlertTitle>
                                                        <AlertDescription>By completing (n) tasks today and earning (n) points you can overtake (friends name) on the leaderboard</AlertDescription>
                                                    </Alert>
                                                </div>
                                            </CarouselItem>
                                            <CarouselItem className={"flex items-center"}>
                                                <div className={"mt-4 mb-4 w-full"}>
                                                    TODO Could create a list and randomly pick a few to be displayed -- could incorporate AI here to generate messages
                                                    <Alert>
                                                        <Smile className={"h-4 w-4"}/>
                                                        <AlertTitle>Motivation Title</AlertTitle>
                                                        <AlertDescription>Motivational messages?</AlertDescription>
                                                    </Alert>
                                                </div>
                                            </CarouselItem>
                                            <CarouselItem className={"flex items-center"}>
                                                <div className={"mt-4 mb-4 w-full"}>
                                                    TODO Same thing with functions to do this
                                                    <Alert>
                                                        <ExclamationTriangleIcon className={"h-4 w-4"}/>
                                                        <AlertTitle>Upcoming Due Date</AlertTitle>
                                                        <AlertDescription>You have (n) days left to complete (task title)</AlertDescription>
                                                    </Alert>
                                                </div>
                                            </CarouselItem>
                                            <CarouselItem className={"flex items-center"}>
                                                <div className={"mt-4 mb-4 w-full"}>
                                                    TODO Needs a function to detect task with subtasks and those with only a few remaining then they need to be rendered in the component
                                                    <Alert>
                                                        <Trophy className={"h-4 w-4"}/>
                                                        <AlertTitle>One Subtask Remaining</AlertTitle>
                                                        <AlertDescription>(Task title) has only one subtask left to check off. Check the subtask today to fully complete the task.
                                                            <Accordion type={"single"} collapsible className={"w-full"}>
                                                                <AccordionItem value={"subtasks"}>
                                                                    <AccordionTrigger>See Completed/Remaining Subtasks for this task</AccordionTrigger>
                                                                    <AccordionContent>
                                                                        Render Subtasks here
                                                                    </AccordionContent>
                                                                </AccordionItem>
                                                            </Accordion>
                                                        </AlertDescription>
                                                    </Alert>
                                                </div>
                                            </CarouselItem>
                                        </CarouselContent>
                                        <CarouselPrevious className={"ml-2"}/>
                                        <CarouselNext className={"mr-2"}/>
                                    </Carousel>*/}

                                </div>
                                <div className={"grid lg:grid-cols-3 gap-4 sm:grid-cols-2"}>
                                    {/*Rendering a card for each task*/}
                                    {tasks.map((task, index) => (
                                        <Card id={index} className={"mt-1 text-lg"}>
                                        <CardHeader className={"space-y-1 grid grid-cols-10 pb-0"}>
                                                <div className={"col-span-8"}>
                                                    <CardTitle>
                                                        <div className={"pr-2"}>
                                                            <Checkbox className={"w-4 h-4 mr-2 mb-2"} checked={task.completed} onCheckedChange={() => {toggleCompletion(task.id)}} />
                                                            {task.title}
                                                        </div>

                                                    </CardTitle>
                                                </div>
                                                <div className={"col-span-1 flex justify-end"}>
                                                    <Button variant={"outline"} size={"icon"} onClick={() => navigate(`/editReminder/${task.id}`)}>
                                                        <PencilIcon className={"h-4 w-4 text-amber-400"}/>
                                                    </Button>
                                                </div>
                                            <div className={"col-span-1 flex justify-end"}>
                                                <Button variant={"outline"} size={"icon"} onClick={() => {deleteTask(task.id);
                                                    toast("Task successfully deleted", {
                                                        description: `Task '${task.title}' has been successfully deleted`
                                                    })}}>
                                                    <TrashIcon className={"h-4 w-4 text-red-500"}/>
                                                </Button>
                                            </div>
                                            </CardHeader>
                                            <CardContent className={"text-sm text-muted-foreground cursor-pointer"} onClick={() => {navigate(`/projectOverview/${task.id}`)}}>
                                                <div className={"grid grid-rows-2 p-0 pt-2"}>
                                                    <div>
                                                        {task.description ? task.description : ""}
                                                    </div>
                                                    <div className={"flex mt-3 justify-between"}>
                                                        {/*Conditionally render points if appropriate*/}
                                                        <div>
                                                            {task.points ? (
                                                                <div className={"flex items-center text-green-500 font-bold"}>
                                                                    <MedalIcon className={"mr-1 h-3.5 w-3.5"}/>
                                                                    <p>{task.points} Points</p>
                                                                </div>
                                                            ) : (
                                                                ""
                                                            )}
                                                        </div>

                                                        <div>
                                                            {/*Having to set the timestamp to be 0 on both dates to appropriately compare them*/}
                                                            {task.dueDate.toDate().setHours(0,0,0,0) < new Date().setHours(0,0,0,0) ? (
                                                                <div className={"text-red-500"}>
                                                                    <div className={"flex items-center"}>
                                                                        <CalendarDaysIcon className={"mr-1 h-3.5 w-3.5"}/>
                                                                        <p>{formatDate(task.dueDate)}</p>
                                                                    </div>

                                                                </div>
                                                            ) : (
                                                                <div className={"flex items-center"}>
                                                                    <CalendarDaysIcon className={"mr-1 h-3.5 w-3.5"}/>
                                                                    <p>{formatDate(task.dueDate)}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                            </CardContent>
                        </Card>
                    </div>

            </div>

        </div>
    )
}

export default Home;