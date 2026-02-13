import React, { useState } from 'react';

import { Button } from "@/src/components/ui/button.jsx";
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/src/components/ui/card.jsx";
import { Label } from "@/src/components/ui/label.jsx";
import { Input } from "@/src/components/ui/input.jsx";
import { Alert, AlertTitle, AlertDescription } from "@/src/components/ui/alert.jsx";
import { ExclamationTriangleIcon, LightningBoltIcon } from "@radix-ui/react-icons";

import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import { auth } from "./Firebase";
import { signInWithEmailAndPassword } from "firebase/auth";


function Login() {
    //Defining constants for use on the page
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    //Firebase handles all authentication when the user submits the form
    const login = async (e) => {
        //Preventing the form being submitted and refreshing the page before firebase registration begins
        e.preventDefault();
        try {
            //Google Firebase, “Authenticate with Firebase using Password-Based Accounts using Javascript,” Firebase. https://firebase.google.com/docs/auth/web/password-auth (accessed Apr. 13, 2024).
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            console.log("Successfully logged in:", userCredential.user);

            navigate("/home");

        } catch (error) {
            setError(error.message);
        }
    }

    return (
        <div className={"flex justify-center items-center h-screen"}>
            <div className={"sm:w-3/4 md:w-1/2"}>
                <Card>
                    <CardHeader className={"space-y-1"}>
                        <CardTitle className={"text-2xl font-bold"}>Login</CardTitle>
                        <CardDescription>Enter your email address and password to login to your
                            account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={login}>
                            <div className={"space-y-4"}>
                                <div className={"space-y-2"}>
                                    <Label htmlFor={"email"}
                                           className={error !== null ? "text-red-500" : ""}>Email</Label>
                                    <Input id={"email"} placeholder={"email@domain.com"} required type={"email"}
                                           value={email} onChange={(e) => setEmail(e.target.value)}/>
                                </div>
                                <div className={"space-y-2"}>
                                    <Label htmlFor={"password"}
                                           className={error !== null ? "text-red-500" : ""}>Password</Label>
                                    <Input id={"password"} placeholder={"Password"} required type={"password"}
                                           value={password} onChange={(e) => setPassword(e.target.value)}/>
                                </div>
                                <Button className={"w-full"} type={"submit"}>Login</Button>
                            </div>
                        </form>
                        <div className={"mt-4"}>
                            <Alert variant={"info"}>
                                <LightningBoltIcon className={"h-4 w-4"}/>
                                <AlertTitle>Need to Register?</AlertTitle>
                                <AlertDescription>Don't have an account? <a href={"/register"} style={{
                                    textDecoration: "underline",
                                    fontWeight: "bold"
                                }}>Click to Register.</a></AlertDescription>
                            </Alert>
                        </div>

                        {error ? (
                            <div className={"mt-4"}>
                                <Alert variant={"destructive"}>
                                    <ExclamationTriangleIcon className={"h-4 w-4"}/>
                                    <AlertTitle>Warning</AlertTitle>
                                    <AlertDescription>Email or Password is Incorrect</AlertDescription>
                                </Alert>
                            </div>
                        ) : (
                            ""
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default Login;
