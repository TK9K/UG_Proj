import React, {useEffect, useState} from "react";
import {useParams, useNavigate} from "react-router-dom";

import {doc, updateDoc, getDoc} from "firebase/firestore";
import {db, auth} from "./Firebase";

import {getFriends, getTeamsWithUser, getUserShortCode} from "./components/Utility.jsx";
import CustomSelect from "./components/customSelect.jsx";
import Sidebar from "@/components/Sidebar.jsx";
import Topbar from "@/components/Topbar.jsx";

//ShadCN/UI Components
import {Card, CardContent, CardHeader, CardTitle} from "@/src/components/ui/card.jsx";
import {Label} from "@/src/components/ui/label.jsx";
import {Input} from "@/src/components/ui/input.jsx";
import {Textarea} from "@/src/components/ui/textarea.jsx";
import {DatePicker} from "@/components/DatePicker.jsx";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/src/components/ui/accordion.jsx";
import {Checkbox} from "@/src/components/ui/checkbox.jsx";
import {Button, ButtonLoading} from "@/src/components/ui/button.jsx";
import {Switch} from "@/src/components/ui/switch.jsx";

//Loading spinner from react bootstrap
import {Spinner} from "react-bootstrap";

import {TrashIcon} from "lucide-react";

//Empty options array for use later
const options = []

const EditReminder = () => {
    //Get userId from firebase authentication
    const userId = auth.currentUser ? auth.currentUser.uid : null;

    //User short code to get the user's social collection
    const [userShortCode, setUserShortCode] = useState("");

    //Sidebar variable to open/close sidebar
    const [sidebar, setSidebar] = useState(true);

    //Storing 'teams/groups' user is a part of
    const [teamsWithUser, setTeamsWithUser] = useState([]);

    const [userFriends, setUserFriends] = useState([]);

    //UseParams() component used to pull the task id from the browser URL when the edit button is clicked and then to take that specific task from local browser storage
    const {taskId} = useParams();
    const navigate = useNavigate();

    //Setting default values for the task on the page
    const [title, setTitle] = useState("");
    const [taskDescription, setDescription] = useState("");
    const [dueDate, setDueDate] = useState(new Date());
    const [priority, setPriority] = useState(0);
    //Custom select component options
    const [selectedOptions, setSelectedOptions] = useState([]);

    //Empty subtasks variable
    const [subtasks, setSubtasks] = useState([]);
    //Map subtasks for checked and text
    const [subtasksState, setSubtasksState] = useState(subtasks.map((text) => ({text, checked: false})));

    //Assign points toggle
    const [assignPoints, setAssignPoints] = useState(false);

    //Page loading while specific task is got from database
    const [pageLoad, setPageLoad] = useState(true);
    const [loading, setLoading] = useState(false);


    //Code to fill the form with the current information from that task
    useEffect(() => {

        // Linked to Utility class
        getTeamsWithUser(userId, setTeamsWithUser);

        const getTasks = async () => {
            try {
                //Getting the specific task to be edited from the tasks document in the users collection (Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024).)
                const taskList = doc(db, "users", auth.currentUser.uid, "tasks", taskId);
                const task = await getDoc(taskList);

                //Checking is task exists before continuing
                if (task.exists()) {
                    //Assigning all the data of the task from the firebase doc to the taskData variable
                    const taskData = task.data();

                    console.log("Task Data: ", taskData);

                    //Setting values on the page based on taskData
                    setTitle(taskData.title || "No Title");
                    setDescription(taskData.description || null);
                    setDueDate(new Date(taskData.dueDate.toDate() || ""));
                    console.log("TaskDueDateToDate: ", taskData.dueDate.toDate(), "Task Due Date: ",)
                    setPriority(taskData.priority || 0);
                    setSubtasksState(taskData.subtasks);
                    console.log("SubtasksState: ", subtasksState);

                    setSelectedOptions(
                        //Map options to select component
                        taskData.teamMembers.map((member) => ({
                            //Sets the value of the option to the user's unique id and the label to their name
                            value: member.id,
                            label: member.displayName,
                        })) || []
                    );
                }
            } catch (error) {
                console.error("Error getting task", error);
            } finally {
                //Finish page load
                setPageLoad(false);
            }
        };

        getTasks();

        //Task id from URL and userID for user both required to find the task
    }, [taskId, userId]);

    useEffect(() => {
        getUserShortCode(userId, setUserShortCode)
    }, [userShortCode]);

    useEffect(() => {
        getFriends(userId, userShortCode, setUserFriends);
    }, [userId, userShortCode]);

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

    //When the update button is clicked the task is changed in local browser storage so the new updated task is displayed on the home page
    const updateTask = async () => {
        try {
            //Don't need to get the timestamp anymore as new date picker doesn't require it
            const formattedDueDate = dueDate;

            //Filter for only selected subtasks
            const checkedSubtasks = subtasksState.filter((subtask) => subtask.checked);

            //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
            const taskList = doc(db, "users", userId, "tasks", taskId);
            //Recreating task with new updated variables -- Google Firebase, “Add data to Cloud Firestore | Firebase Documentation,” Firebase.  https://firebase.google.com/docs/firestore/manage-data/add-data#update-data (accessed Apr. 23, 2024).
            await updateDoc(taskList, {
                title: title,
                description: taskDescription,
                dueDate: formattedDueDate,
                priority: priority,
                subtasks: checkedSubtasks.map((subtask) => ({ text: subtask.text, ...(assignPoints ? {points: subtask.points} : {}), checked: false})), //Will also need to store points with each
                teamMembers: selectedOptions.map((option) => ({id: option.value, displayName: option.label})),
            });
            //Move the user back to home page
            navigate("/home");
        } catch (error) {
            console.error("Error updating task", error);
        }
    };

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

    //Open/close sidebar
    const toggleSidebar = () => {
        setSidebar(!sidebar);
    }

    return (
        <div className="flex w-full h-screen">
            {/*Code for generating spinner from -- React-Bootstrap, “Spinners | React Bootstrap,” react-bootstrap.netlify.app. https://react-bootstrap.netlify.app/docs/components/spinners/ (accessed Apr. 20, 2024).*/}
            {pageLoad ? (
                <Spinner animation="border" variant="dark" role={"status"}>
                    <span className={"visually-hidden"}>Loading...</span>
                </Spinner>
            ) : (
                <div className={"flex w-full h-screen"}>
                    <nav>
                        <Sidebar isOpen={sidebar} />
                    </nav>
                    <div className={"w-full"}>
                        <header>
                            <Topbar currentPage={"Edit Reminder"} onToggleSidebar={toggleSidebar}/>
                        </header>
                        {/*Will potentially remove this page entirely and make it a component displayed in a modal/dialog on the appropriate page -- will likely involve creating dialoges for multiple pages to replace the edit functionality provided on this page and needed by project overview*/}
                        <div className={"p-4"}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Update Existing Reminder</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className={"space-y-4"}>
                                        <div className={"grid grid-cols-2 gap-4"}>
                                            <Label htmlFor={"title"}>Title</Label>
                                            <Input id={"title"} placeholder={"Title"} required type={"text"}
                                                   value={title}
                                                   onChange={(e) => setTitle(e.target.value)}/>
                                        </div>
                                        <div className={"grid grid-cols-2 gap-4"}>
                                            <Label htmlFor={"taskDescription"}>Description</Label>
                                            <Textarea id={"taskDescription"} placeholder={"Description"}
                                                      type={"textarea"}
                                                      value={taskDescription}
                                                      onChange={(e) => setDescription(e.target.value)}/>
                                        </div>
                                        <div className={"space-y-4"}>
                                            <div className={"grid grid-cols-2 gap-4"}>
                                                <Label htmlFor={"dueDate"}>Due Date</Label>
                                                <DatePicker id={"dueDate"} presetDate={dueDate}
                                                            onChange={(selectedDate) => setDueDate((selectedDate))}/>
                                            </div>
                                        </div>
                                        <div className={"space-y-4"}>
                                            <Accordion type={"single"} collapsible className={"w-full"}>
                                                <AccordionItem value={"subtasksOptions"}>
                                                    <AccordionTrigger>Add Subtasks to Breakdown your Overall
                                                        Task</AccordionTrigger>
                                                    <AccordionContent>
                                                        <p className={"text-sm text-muted-foreground"}>Below you can add
                                                            optional subtasks to your overall task. You can
                                                            automatically break
                                                            down a task by clicking the 'Generate' button. Click the
                                                            checkbox
                                                            next to each subtask you want to attach to your overall
                                                            task. You
                                                            can also click the 'Add Subtask' button to manually add and
                                                            create
                                                            your own subtasks.</p>
                                                        {/*Map out a checkbox and input box for each subtask*/}
                                                        {subtasksState.map((subtask, index) => (
                                                            <div key={index} className={"flex items-center mt-3"}>
                                                                <Checkbox className={"w-5 h-5 mr-2"}
                                                                          checked={subtask.checked}
                                                                          onCheckedChange={() => handleSubtaskCheck(index)}/>
                                                                <Input value={subtask.text}
                                                                       onChange={(e) => handleSubtaskEdit(e.target.value, index)}/>
                                                                <div className={"ml-2"}>
                                                                    <Button variant={"outline"} size={"icon"}
                                                                            onClick={() => deleteSubtask(index)}>
                                                                        <TrashIcon className={"h-4 w-4 text-red-500"}/>
                                                                    </Button>
                                                                </div>

                                                            </div>
                                                        ))}

                                                            <div className={"grid grid-cols-4 gap-4 w-full"}>
                                                                <div/>
                                                                {loading ? (
                                                                    <ButtonLoading className={"w-full"}
                                                                                   value={"Generating..."}
                                                                                   colour={"amber-500"}/>
                                                                ) : (
                                                                    <Button variant={"warn"} className={"w-full"}
                                                                            onClick={() => aiSubtasksGenerate()}>Generate</Button>
                                                                )}
                                                                <Button className={"w-full"}
                                                                        onClick={() => manualSubtask()}>Add
                                                                    Subtask</Button>
                                                            </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        </div>
                                        {/*Priority --Am i going to use this? */}
                                        <div className={"space-y-4"} />

                                        {/*Select -e.g. friends-team members -- what role does this play in my new application? */}
                                        <div className={"space-y-4"}>
                                            <div className={"grid grid-cols-2 gap-4"}>
                                                <Label htmlFor={"selectFriends"}>Share Task with Friends</Label>
                                                <CustomSelect id={"selectFriends"} menuPlacement={"top"}
                                                              options={generateOptions()} value={selectedOptions}
                                                              onChange={(selected) => setSelectedOptions(selected)}
                                                              placeholder={"Choose Friends"}></CustomSelect>
                                            </div>
                                        </div>
                                        {/*Styling of the switch based on -- ShadCN, “Switch,” ui.shadcn.com. https://ui.shadcn.com/docs/components/switch (accessed Apr. 07, 2024).*/}
                                        <div
                                            className={"flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"}>
                                            <div>
                                                <p className={"text-sm font-semibold"}>Assign Points to Task and
                                                    Subtasks</p>
                                                <p className={"text-sm text-muted-foreground"}>You can choose not to
                                                    assign
                                                    points to a specific created task. By default all tasks and related
                                                    subtasks
                                                    are assigned point values automatically.</p>
                                            </div>
                                            <Switch disabled={true} checked={assignPoints}
                                                    onCheckedChange={() => setAssignPoints(!assignPoints)}></Switch>
                                        </div>
                                        {/*Buttons Add/Cancel*/}
                                        <div className={"space-y-4"}>
                                            <div className={"grid grid-cols-2 gap-4"}>
                                                {loading ? (
                                                    <ButtonLoading className={"w-full"} value={"Loading..."}/>
                                                ) : (
                                                    <Button className={""} onClick={async () => {
                                                        setLoading(true);
                                                        //Need to work out how i want to do point assignment here
                                                        setLoading(false);
                                                        updateTask();
                                                    }
                                                    }>Confirm</Button>
                                                )}

                                                <Button variant={"destructive"} className={""}
                                                        onClick={() => navigate("/home")}>Cancel</Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                        </div>

                    </div>
                </div>
            )
            }


        </div>

    )
}
export default EditReminder;