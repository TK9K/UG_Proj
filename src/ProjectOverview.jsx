import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";

import Sidebar from "@/components/Sidebar.jsx";
import Topbar from "@/components/Topbar.jsx";
import {getInitials} from "@/components/Utility.jsx";
import {addPointsToWeek} from "@/components/Points.jsx";

//ShadCN UI Components
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/src/components/ui/card.jsx";
import { Avatar, AvatarFallback} from "@/src/components/ui/avatar.jsx";
import { Checkbox } from "@/src/components/ui/checkbox.jsx";
import {Button} from "@/src/components/ui/button.jsx";

import {db, auth} from "@/Firebase.jsx";
import {doc, getDoc, updateDoc} from "firebase/firestore";

import {PlusIcon} from "@radix-ui/react-icons";

//Needs renaming doesnt make sense now
function ProjectOverview() {
    //Get userid from firebase auth
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    //Sidebar open/close var
    const [sidebar, setSidebar] = useState(true);

    //Variable storing ful list of tasks
    const [tasks, setTasks] = useState([]);

    //Get taskid from URL
    const {projectId} = useParams();
    const navigate = useNavigate();

    //Variables for all parts of the task
    const [title, setTitle] = useState("");
    const [taskDescription, setDescription] = useState("");
    const [dueDate, setDueDate] = useState(new Date());
    const [priority, setPriority] = useState(0);
    const [subtasks, setSubtasks] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);

    //Open/close sidebar
    const toggleSidebar = () => {
        setSidebar(!sidebar);
    }

    //Sending the change in status of the subtask to the firebase database when checked
    const toggleSubtaskCompletion = async (projectId, subtaskIndex) => {

        try {
            //Standard code for getting the tasks collection
            //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
            const task = doc(db, "users", auth.currentUser.uid, "tasks", projectId);
            const taskCompleted = await getDoc(task);
            //Store data of specific task
            const taskData = taskCompleted.data();

            //Creating a new variable with all the task's subtasks
            const updatedSubtasks = [...taskData.subtasks];

            //Flipping the boolean status of the checked subtask in the array
            updatedSubtasks[subtaskIndex].checked = !updatedSubtasks[subtaskIndex].checked;

            if (updatedSubtasks[subtaskIndex].checked) {
                //Get subtask points and pass to relevant method -- add points if subtask checked
                let subtaskPoints = updatedSubtasks[subtaskIndex].points;
                addPointsToWeek(new Date, userId, subtaskPoints);
            } else {
                //Remove points if subtask unchecked
                let subtaskPoints = -updatedSubtasks[subtaskIndex].points;
                addPointsToWeek(new Date, userId, subtaskPoints);
            }

            //Sending the new subtasks array -- based on code from firestore docs Google Firebase, “Add data to Cloud Firestore | Firebase Documentation,” Firebase.  https://firebase.google.com/docs/firestore/manage-data/add-data#update-data (accessed Apr. 23, 2024).
            await updateDoc(task, {
                subtasks: updatedSubtasks
            });

            setSubtasks(updatedSubtasks);

            //Updating the local tasks array to contain the newly changed subtasks array
            const updatedTasks = tasks.map((task) =>
                task.id === projectId ? { ...task, subtasks: updatedSubtasks } : task
            );

            setTasks(updatedTasks);
        } catch (error) {
            console.error("Error updating subtasks", error)
        }
    }

    useEffect( () => {
        //Get specific task to populate fields of the page
        const getTask = async () => {
            try {
                //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
                const taskQuery = doc(db, "users", auth.currentUser.uid, "tasks", projectId);
                const task = await getDoc(taskQuery);

                if (task.exists()) {
                    //Store task data
                    const taskData = task.data();

                    //Set relevant fields
                    setTitle(taskData.title || "No Title");
                    setDescription(taskData.description || "No Description");
                    setDueDate(new Date(taskData.dueDate || ""));
                    console.log("Due Date: ", dueDate.toDateString())
                    setPriority(taskData.priority || 0);
                    setSubtasks(taskData.subtasks || []);
                    setTeamMembers(taskData.teamMembers || []);
                }
            } catch (e) {
                console.error("Error getting task: ", e);
            }
        };

        getTask();
    }, [projectId, userId]);

    return (
        <div className="flex w-full h-screen">
            <nav>
                <Sidebar isOpen={sidebar} />
            </nav>

            <div className={"w-full"}>
                <header>
                    <Topbar currentPage={`Task Overview - ${title}`} onToggleSidebar={toggleSidebar}/>
                </header>

            <div className="p-4">
                {/*Show two cards on line if screen size is appropriate*/}
                <div className="grid gap-2 md:grid-cols-2">
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className={"text-2xl font-bold"}>Subtasks</CardTitle>
                                <CardDescription>All Defined Subtasks for this Project Are Shown Below</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className={"flex flex-col"}>
                                    {subtasks && subtasks.map((subtask, index) => (
                                        <div>
                                            <Checkbox id={index} checked={subtask.checked} onCheckedChange={() => toggleSubtaskCompletion(projectId, index)}/>
                                            <label className={"pl-2"} htmlFor={index}>{subtask.text} {subtask.points ? `(${subtask.points})` : ""}</label>
                                        </div>
                                    ))}
                                    {/*Manual Subtask Creation*/}
                                    <Button className={"ml-auto rounded-full bg-slate-950"} size={"icon"}>
                                        <PlusIcon className={"h-4 w-4"} onClick={() => {navigate(`/editReminder/${projectId}`)}}/>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className={"text-2xl font-bold"}>Friends</CardTitle>
                                <CardDescription>If you are working with a friend on this task they will be shown here. You can also add friends to the task from here.</CardDescription>
                            </CardHeader>
                            <CardContent className={"grid gap-4"}>

                                    {teamMembers && teamMembers.map((member, index) => (
                                        <div className={"flex items-center justify-between space-x-4"}>
                                            <div className={"flex items-center space-x-3"}>
                                                <Avatar>
                                                    <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className={"text-sm font-semibold"}>{member.displayName}</p>
                                                </div>
                                            </div>
                                        </div>

                                    ))}
                                <Button className={"ml-auto rounded-full bg-slate-950"} size={"icon"}>
                                    <PlusIcon className={"h-4 w-4"} onClick={() => {navigate(`/editReminder/${projectId}`)}}/>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                </div>

            </div>
        </div>
        </div>
    )
}

export default ProjectOverview;