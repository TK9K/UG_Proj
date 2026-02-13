import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

//Importing relevant pages
import Login from './Login';
import Home from "@/Home.jsx";
import Register from "./Register";
import AddReminder from "./AddReminder";
import EditReminder from "./EditReminder";
import useAuthenticated from "./useAuthenticated";
import ProjectOverview from "@/ProjectOverview.jsx";
import Profile from "./Profile.jsx";
import Dashboard from "./Dashboard.jsx";
import SocialCircle from "@/SocialCircle.jsx";

//Import the loading spinner
import { Spinner } from "react-bootstrap";

//Initalise toasts for the application
import {Toaster} from "@/src/components/ui/sonner.jsx";

function App() {
    //Get the user authentication state
    const { user, loading } = useAuthenticated();

    //Displays a spinner while not authenticated / user in process of authentication
    if (loading) {
        return (
            <div className={"d-flex justify-content-center align-items-center"} style={{ height: "100vh "}}>
                {/*Code for generating spinner from -- React-Bootstrap, “Spinners | React Bootstrap,” react-bootstrap.netlify.app. https://react-bootstrap.netlify.app/docs/components/spinners/ (accessed Dec. 31, 2023).*/}
                <Spinner animation="border" variant="dark" role={"status"}>
                    <span className={"visually-hidden"}>Loading...</span>
                </Spinner>
            </div>
        );
    }

    return (
        // Code for managing routes based on -- React Router, “BrowserRouter v6.11.1,” reactrouter.com. https://reactrouter.com/en/main/router-components/browser-router (accessed Nov. 21, 2023).
        <div>
            <Router>
                <Routes>
                    {/*Unprotected Routes --> No requirement for authentication*/}
                    <Route path={"/login"} element={<Login />} />
                    <Route path={"/register"} element={<Register />} />

                    {/*Checks if the user is authenticated before granting access to these routes*/}
                    {user ? (
                        <>
                            <Route path={"/home"} element={<Home />} />
                            <Route path={"/projectOverview/:projectId"} element={<ProjectOverview />} />
                            <Route path={"/addReminder"} element={<AddReminder />} />
                            {/*Docs on dynamically rendering pages based on parameters -- T. McGinnis, “The Complete Guide to URL parameters with React Router,” ui.dev, Sep. 10, 2021. https://ui.dev/react-router-url-parameters (accessed Dec. 31, 2023).*/}
                            <Route path={"/editReminder/:taskId"} element={<EditReminder />} />
                            <Route path={"/socialCircle"} element={<SocialCircle />} />
                            <Route path={"/profile"} element={<Profile />} />
                            <Route path={"/dashboard"} element={<Dashboard />} />
                        </>

                    ) : (
                        // If user isnt logged in route them to the login page
                        <Route path={"/*"} element={<Navigate to={"/login"} />} />
                    )}
                </Routes>
            </Router>
            <Toaster />
        </div>


    )
}

export default App;