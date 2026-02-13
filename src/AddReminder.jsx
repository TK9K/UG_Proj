import React, {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";

import { v4 as uuidv4 } from "uuid";

import { auth, db } from "./Firebase";
import {addDoc, collection} from "firebase/firestore";

import CustomSelect from "./components/customSelect.jsx";
import {getFriends, getTeamsWithUser, getUserShortCode} from "./components/Utility.jsx"
import {pointsGenerate, subtasksGenerate} from "./components/OpenAIAPI";

import Sidebar from "@/components/Sidebar.jsx";
import Topbar from "@/components/Topbar.jsx";

// SHADCN/UI Components
import {DatePicker} from "@/components/DatePicker.jsx";
import {Card, CardContent, CardHeader, CardTitle} from "@/src/components/ui/card.jsx";
import {Label} from "@/src/components/ui/label.jsx";
import {Input} from "@/src/components/ui/input.jsx";
import {Textarea} from "@/src/components/ui/textarea.jsx";
import {Accordion, AccordionTrigger, AccordionItem, AccordionContent} from "@/src/components/ui/accordion.jsx";
import {Button, ButtonLoading} from "@/src/components/ui/button.jsx";
import {Checkbox} from "@/src/components/ui/checkbox.jsx";
import {Switch} from "@/src/components/ui/switch.jsx";

import {TrashIcon} from "lucide-react";

const AddReminder = () => {
    //Getting userId from firebase authentication
    const userId = auth.currentUser ? auth.currentUser.uid : null;

    const [userShortCode, setUserShortCode] = useState("");

    //Sidebar variable to open/close sidebar
    const [sidebar, setSidebar] = useState(true);

    //Storing the 'teams/groups' a user is part of
    const [teamsWithUser, setTeamsWithUser] = useState([]);

    const [userFriends, setUserFriends] = useState([]);

    // Defining the variables for use on the add reminders page and to be passed on to the JSON local browser storage task list
    const [title, setTitle] = useState("");
    const [totalPoints, setTotalPoints] = useState(0);
    const [taskDescription, setDescription] = useState("");
    const [dueDate, setDueDate] = useState(new Date());
    const [priority, setPriority] = useState(0);
    // Custom select component selected options for assignment to group members
    const [selectedOptions, setSelectedOptions] = useState([]);

    //Empty subtasks variable
    const [subtasks, setSubtasks] = useState([]);
    //Mapping subtasks variable to contain text and a 'checked' variable
    const [subtasksState, setSubtasksState] = useState(subtasks.map((text) => ({ text, checked: false, points: 0})));

    //Variable used to allow user to not assign points to a task
    const [assignPoints, setAssignPoints] = useState(true);

    //Variable to set buttons to loading state
    const [loading, setLoading] = useState(false);

    //Ensure points assignment has finished before adding task to prevent firestore errors
    const [pointsAssignmentCompleted, setPointsAssignmentCompleted] = useState(false);

    //Navigate component to appropriately move users between pages
    const navigate = useNavigate();

    useEffect(() => {
        //Linked to utility class
        getTeamsWithUser(userId, setTeamsWithUser);
        getFriends(userId, userShortCode, setUserFriends);
        console.log("User Friends: ", userFriends)
    }, [userId, userShortCode]);

    useEffect(() => {
        getUserShortCode(userId, setUserShortCode)
    }, [userShortCode]);

    const generateOptions = () => {
        //Flattening array of arrays into a single array -- (FreeCodeCamp and K. Nwobodo, “How to Use the flat() and flatMap() Methods to Flatten Arrays in JavaScript,” freeCodeCamp.org, Jul. 26, 2022. https://www.freecodecamp.org/news/flat-and-flatmap-javascript-array-methods/ (accessed Jan. 17, 2024).)
        let userGroups = teamsWithUser.flatMap((team) => [
            //Initialise each 'team' and disable it for use as a 'group label'
            { value: team.teamName, label: team.teamName, isTeam: true, isDisabled: true },
            //map each team member onto the array, setting the team to false so not disabled options
            //Using the elipsis operator to map each team member element to one array (FreeCodeCamp, “... in JavaScript – the Three Dots Operator in JS,” freeCodeCamp.org, Aug. 10, 2022. https://www.freecodecamp.org/news/three-dots-operator-in-javascript/ (accessed Jan. 17, 2024).)
            ...team.members.map((member) => ({ value: member.userId, label: member.displayName, isTeam: false})),
        ]);
        let userFriendList = userFriends.map((friend) => ({
            //Map the friends list variables to the structure required by react-select
            value: friend.friendId,
            label: friend.friendDisplayName,
        }));

        let friendsLabel = {
            //Creating a label for 'friends'
            value: null,
            label: "Friends",
            isDisabled: true,
        }

        //Returning the friends label and spreaded array objects
        return [friendsLabel, ...userFriendList, ...userGroups];
    };
    const addTask = async (tempTotalPoints) => {
        //Checking at leas the title field of the task has been filled before the task can be added

        await aiPointsAssignment();

        //Check if the user has enabled points assignment and if it has completed
        if (pointsAssignmentCompleted || !assignPoints) {
            if (title.trim() !== "") {
                //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection - initialise collection
                const userTasks = collection(db, "users", userId, "tasks");

                console.log("Subtask state before checked: ", subtasksState);
                //Only assigning checked subtasks to the overall task. (based on filter - Mozilla, “Array.prototype.filter(),” MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter (accessed Jan. 24, 2024).)
                //State not updating by the time this is called ?
                const checkedSubtasks = subtasksState.filter((subtask) => subtask.checked);

                console.log("Filtered checked subtasks: ", checkedSubtasks);

                //Set total points value to initially be 0
                let pointsTotalFinal = 0;

                //If there are subtasks and the user has chosen to assign points calculate points based on the sum of subtask points
                if (checkedSubtasks.length > 0 && assignPoints !== false) {
                    console.log("Checked subtasks -- attemping to create point value")
                    console.log("Checked Subtasks: ", checkedSubtasks)
                    for (let tempSubtask of checkedSubtasks) {
                        console.log("tempSubtask: ", tempSubtask, "tempSubtask.points: ", tempSubtask.points)
                        console.log("Points Total Final: ", pointsTotalFinal, "Subtask.points: ", tempSubtask.points)
                        pointsTotalFinal += tempSubtask.points;
                    }
                    //If no subtasks set overall points to value passed from aiPointsGenerate function
                } else if (assignPoints !== false) {
                    console.log("No checked subtasks -- assigning total points")
                    pointsTotalFinal = tempTotalPoints;
                    console.log("Points Total Final == temp Total Points", tempTotalPoints)
                }

                //Setting up a new task variable to be populated on the reminder page by the user (based on code from Google Firebase, “Add data to Cloud Firestore | Firebase Documentation,” Firebase. https://firebase.google.com/docs/firestore/manage-data/add-data (accessed Apr. 23, 2024).)
                const newTask = {
                    //Assigning a unique id to each task based on this code -- (GeeksForGeeks, “How to create an unique id in ReactJS ?,” GeeksforGeeks, Oct. 10, 2023. https://www.geeksforgeeks.org/how-to-create-an-unique-id-in-reactjs/ (accessed Dec. 04, 2023).) and [10]Clerk, “Generating and Using UUIDs in React,” Clerk, Apr. 20, 2023. https://clerk.com/blog/generating-and-using-uuids-in-react (accessed Dec. 04, 2024).)
                    id: uuidv4(),
                    title: title, //Convert this to an array of title and points
                    description: taskDescription,
                    dueDate: dueDate,
                    priority: priority,
                    //Conditioanlly adding subtasks points only if assignPoints is true
                    subtasks:  checkedSubtasks.map((subtask) => ({
                        text: subtask.text, ...(assignPoints ? {points: subtask.points} : null),
                        checked: false
                    })),
                    teamMembers: selectedOptions.map((option) => ({id: option.value, displayName: option.label})),
                    completed: false,
                    points: pointsTotalFinal,

                };

                console.log("Due Date: ", dueDate);

                console.log("New Task: ", newTask);

                //Add new task to array of tasks in userTask collection
                await addDoc(userTasks, newTask);

                if (newTask.teamMembers) {
                    let ids = [];
                    newTask.teamMembers.forEach((member) => {
                        ids.push(member.id);
                    })
                    console.log("Team member id's", newTask.teamMembers);
                    console.log("Contains team mebers");
                    console.log("Member ids: ", ids);

                    ids.forEach((id) => {
                        const friendTasks = collection(db, "users", id, "tasks");

                        const newFriendTask = {
                            id: uuidv4(),
                            title: title, //Convert this to an array of title and points
                            description: taskDescription,
                            dueDate: dueDate,
                            priority: priority,
                            subtasks: checkedSubtasks.map((subtask) => ({
                                text: subtask.text,
                                checked: false
                            })),
                            //Need to change this so the user the task is assigned to isn't listed as a friend
                            teamMembers: [{id: userId, displayName: auth.currentUser.displayName}], //Array containing only the assigning user
                            completed: false,
                        };
                        addDoc(friendTasks, newFriendTask);
                    })
                }

                //Navigates the user back to the main 'home' page
                navigate("/home");
            }


        }
    };

    const aiSubtasksGenerate = async () => {

        try {
            //Display loading indicator while querying the model
            setLoading(true);

            //Passing the title of the task to the model
            const responseJSON = await subtasksGenerate(title);

            //Parsing model response
            const response = JSON.parse(responseJSON);

            if (response.subtasks) {
                //Setting an array variable that will be used below
                const subtasksArray = response.subtasks || [];

                //Testing the result of JSON parsing
                console.log("SUBTASKS ARRAY: ", subtasksArray)

                //Mapping a checked variable to the array so the user can select specific tasks that they want
                setSubtasksState(subtasksArray.map((text) => ({text, checked: false})));
            }

        } finally {
            //Disabling loading indicator
            setLoading(false);
        }
    }

    const aiPointsAssignment = async () => {
        console.log("TITLE: ", title, "SUBTASKS: ", subtasks)

        //Initialise total points as 0
        let totalPointsFromModel = 0;

        //Run if user has enabled point assignment
        if (assignPoints !== false) {
            try {
                //Only send text
                const subtasksTextOnly = subtasksState.map(subtask => subtask.text);

                //Pass task title to points generate function in OpenAIAPI.js
                const responseJSON = await pointsGenerate(title, subtasksTextOnly);
                //Testing response
                console.log("Response for Points: ", responseJSON);

                //Should return 3 distinct values 'task' which is just the title; 'points' which is the overall point value, 'subtasks' formatted as [subtask, points]
                const response = JSON.parse(responseJSON);
                console.log("Parsed Response: ", response)

                //Using the points variable to assign total points to the overall task
                console.log("Total Points: ", response.points);

                // Force state update immediately =>
                setTotalPoints(prevTotalPoints => response.points);

                //Setting the total points from parsed JSON
                totalPointsFromModel = response.points;
                console.log("Total Points Var: ", totalPoints);
                console.log("Total Points temp Var: ", totalPointsFromModel)

                //Get the subtasks array with points
                console.log("Subtask with Points: ", response.subtasks);
                const subtasksWithPoints = response.subtasks;

                console.log("Subtask state before update: ", subtasksState)

                //Create an array contianing only the points for each subtask
                const points = subtasksWithPoints.map(subtask => subtask.points);
                console.log("Points: ", points)

                //Update the subtask state to apply the points value of the relevant subtask
                const updatedSubtaskState = subtasksState.map((subtask, index) => {
                    return {...subtask, points: points[index]};
                })

                console.log("Updated subtask state: ", updatedSubtaskState);

                setSubtasksState(updatedSubtaskState);
                //Set the function to have completed allowing AddTask to complete without error
                setPointsAssignmentCompleted(true);


            } catch (e) {
                console.error("Error assigning points: ", e);
            }
            return totalPointsFromModel;
        }
        }

    //Function to enable the user to edit the generated tasks
    const handleSubtaskEdit = (value, index) => {
        setSubtasksState((prevSubtasks) => {
            //Temporary variable for storing subtasks, spreading array to checked and text
            const newSubtasks = [...prevSubtasks];
            //Chaning subtask text value to new value when editied
            newSubtasks[index] = { ...newSubtasks[index], text: value };
            return newSubtasks;
        });
    };

    //Setting the checked variable to true when the task is checked
    const handleSubtaskCheck = (index) => {
        console.log("Subtask Check triggered on index: ", index);
        setSubtasksState((prevSubtasks) => {
            //Temporary variable for storing subtasks, spreading to checked and text
            const newSubtasks = [...prevSubtasks];
            //Boolean flipping checked value
            newSubtasks[index] = { ...newSubtasks[index], checked: !newSubtasks[index].checked };
            return newSubtasks;
        });
    };

    const manualSubtask = () => {
        //Manual subtask creation - spreadu subtask state, add new value with no text and checked
        setSubtasksState([...subtasksState, {text: "", checked: true}]);
        setSubtasks([...subtasks, ""]);
    };

    const deleteSubtask = (index) => {
        //Expanding subtask state out to text and checked for each element
        const newSubtasks = [...subtasksState];
        //Based on code from - StackOverflow, “How can I remove a specific item from an array in JavaScript?,” Stack Overflow, Jun. 29, 2022. https://stackoverflow.com/questions/5767325/how-can-i-remove-a-specific-item-from-an-array-in-javascript (accessed Feb. 28, 2024).
        newSubtasks.splice(index, 1);
        setSubtasksState(newSubtasks);
    }

    const toggleSidebar = () => {
        setSidebar(!sidebar);
    }

    return (
        <div className="flex w-full h-screen">
            <nav>
                <Sidebar isOpen={sidebar}/>
            </nav>

            <div className={"w-full"}>
                <header>
                    <Topbar currentPage={"Add New Reminder"} onToggleSidebar={toggleSidebar}/>
                </header>
                {/*Will potentially remove this page entirely and make it a component displayed in a modal/dialog on the appropriate page -- will likely involve creating dialoges for multiple pages to replace the edit functionality provided on this page and needed by project overview*/}
                <div className={"p-4"}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Reminder</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={"space-y-4"}>
                                <div className={"grid grid-cols-2 gap-4"}>
                                    <Label htmlFor={"title"}>Title</Label>
                                    <Input id={"title"} placeholder={"Title"} required type={"text"} value={title}
                                           onChange={(e) => setTitle(e.target.value)} />
                                </div>
                                <div className={"grid grid-cols-2 gap-4"}>
                                    <Label htmlFor={"taskDescription"}>Description</Label>
                                    <Textarea id={"taskDescription"} placeholder={"Description"} type={"textarea"}
                                              value={taskDescription} onChange={(e) => setDescription(e.target.value)} />
                                </div>
                                <div className={"space-y-4"}>
                                    <div className={"grid grid-cols-2 gap-4"}>
                                        <Label htmlFor={"dueDate"}>Due Date</Label>
                                        <DatePicker id={"dueDate"} onChange={(selectedDate) => setDueDate((selectedDate))} />
                                    </div>
                                </div>
                                <div className={"space-y-4"}>
                                    <Accordion type={"single"} collapsible className={"w-full"}>
                                        <AccordionItem value={"subtasksOptions"}>
                                            <AccordionTrigger>Add Subtasks to Breakdown your Overall Task</AccordionTrigger>
                                            <AccordionContent>
                                                <p className={"text-sm text-muted-foreground"}>Below you can add optional subtasks to your overall task. You can automatically break down a task by clicking the 'Generate' button. Click the checkbox next to each subtask you want to attach to your overall task. You can also click the 'Add Subtask' button to manually add and create your own subtasks.</p>
                                                {subtasksState.map((subtask, index) => (
                                                    <div key={index} className={"flex items-center mt-3"}>
                                                        <Checkbox className={"w-5 h-5 mr-2" } checked={subtask.checked} onCheckedChange={() => handleSubtaskCheck(index)} />
                                                        <Input value={subtask.text} onChange={(e) => handleSubtaskEdit(e.target.value, index)} />
                                                        <div className={"ml-2"}>
                                                            <Button variant={"outline"} size={"icon"} onClick={() => deleteSubtask(index)}>
                                                                <TrashIcon className={"h-4 w-4 text-red-500"} />
                                                            </Button>
                                                        </div>

                                                    </div>
                                                ))}

                                                <div className={"space-y-4 mt-4 flex justify-center"}>
                                                    <div className={"grid grid-cols-4 gap-4 w-full"}>
                                                        <div/>
                                                        {loading ? (
                                                            <ButtonLoading className={"w-full"} value={"Generating..."} colour={"amber-500"} />
                                                        ) : (
                                                            <Button variant={"warn"} className={"w-full"} onClick={() => aiSubtasksGenerate()} disabled={!title}>Generate</Button>
                                                        )}
                                                        <Button className={"w-full"} onClick={() => manualSubtask()}>Add Subtask</Button>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </div>
                                {/*Priority --Am i going to use this? */}
                                <div className={"space-y-4"}>

                                </div>
                                {/*Select -e.g. friends-group members */}
                                <div className={"space-y-4"}>
                                    <div className={"grid grid-cols-2 gap-4"}>
                                        <Label htmlFor={"selectFriends"}>Share Task with Friends</Label>
                                        <CustomSelect id={"selectFriends"} menuPlacement={"top"} options={generateOptions()} value={selectedOptions}
                                                      onChange={(selected) => setSelectedOptions(selected)}
                                                      placeholder={"Choose Friends"}></CustomSelect>
                                    </div>
                                </div>
                                {/*Styling of the switch based on -- ShadCN, “Switch,” ui.shadcn.com. https://ui.shadcn.com/docs/components/switch (accessed Apr. 07, 2024).*/}
                                <div className={"flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"}>
                                    <div>
                                        <p className={"text-sm font-semibold"}>Assign Points to Task and Subtasks</p>
                                        <p className={"text-sm text-muted-foreground"}>You can choose not to assign
                                            points to a specific created task. By default all tasks and related subtasks
                                            are assigned point values automatically.</p>
                                    </div>
                                    <Switch checked={assignPoints} onCheckedChange={() => setAssignPoints(!assignPoints)}></Switch>
                                </div>
                                {/*Buttons Add/Cancel*/}
                                <div className={"space-y-4"}>
                                <div className={"grid grid-cols-2 gap-4"}>
                                        {loading ? (
                                            <ButtonLoading className={"w-full"} value={assignPoints ? "Assigning Points..." : "Loading..."} />
                                        ) : (
                                            /*Disabling the button if there is no task title*/
                                            <Button className={""} disabled={!title} onClick={async () => {
                                                setLoading(true);
                                                await addTask(totalPoints);
                                                setLoading(false);
                                                }
                                            }>Confirm</Button>
                                        )}

                                        <Button variant={"destructive"} className={""} onClick={() => navigate("/home")}>Cancel</Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>

            </div>

        </div>

    );
};
export default AddReminder;