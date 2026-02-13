import React, {useState} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

import { auth } from "./Firebase";

import {createUserWithEmailAndPassword, updateProfile} from "firebase/auth";
import {useNavigate} from 'react-router-dom';

//ShadCN UI components
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/src/components/ui/card.jsx";
import {Label} from "@/src/components/ui/label.jsx";
import {Input} from "@/src/components/ui/input.jsx";
import {ExclamationTriangleIcon, LightningBoltIcon} from "@radix-ui/react-icons";
import {Button} from "@/src/components/ui/button.jsx";
import {Alert, AlertTitle, AlertDescription} from "@/src/components/ui/alert.jsx";

function Register() {
    //Constants for use on the page
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const register = async (e) => {
        //Preventing the form being submitted and refreshing the page before firebase registration begins
        e.preventDefault();

        //Locally check both emails are the same
        if (email !== e.target.email2.value) {
            setError("Emails do not match")

            //Locally check both passwords are the same
        } else if (password !== e.target.password2.value) {
            setError("Passwords do not match")
        } else if (password.length <= 6) {
            //Locally check password length
            setError("Password must be at least 6 characters")
        } else {
            //Firebase handles the creation of a user
            try {
                //Google Firebase, “Authenticate with Firebase using Password-Based Accounts using Javascript,” Firebase. https://firebase.google.com/docs/auth/web/password-auth (accessed Apr. 13, 2024).
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                //Appending additional information to the user authentication record
                await updateProfile(userCredential.user, {
                    displayName: `${firstName} ${lastName}`
                });

                console.log("Successfully Registered:", userCredential.user);
                navigate("/login");

            } catch (error) {
                console.error("Registration Error:", error);
                setError(error.message);

            }
        }
        }

    return (
        <div className={"flex justify-center items-center h-screen"}>
            <div className={"sm:w-3/4 md:w-1/2"}>
            <Card>
                <CardHeader className={"space-y-1"}>
                    <CardTitle className={"text-2xl font-bold"}>Register</CardTitle>
                    <CardDescription>Enter the following details to create a new account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={register}>
                        <div className={"space-y-4"}>
                            <div className={"grid grid-cols-2 gap-4"}>
                                <div className={"space-y-2"}>
                                    <Label htmlFor={"firstName"}>First Name</Label>
                                    <Input id={"firstName"} placeholder={"First Name"} required type={"text"}
                                           value={firstName} onChange={(e) => setFirstName(e.target.value)}/>
                                </div>
                                <div className={"space-y-2"}>
                                    <Label htmlFor={"lastName"}>Last Name</Label>
                                    <Input id={"lastName"} placeholder={"Last Name"} required type={"text"}
                                           value={lastName} onChange={(e) => setLastName(e.target.value)}/>
                                </div>
                            </div>
                            <div className={"grid grid-cols-2 gap-4"}>
                                <div className={"space-y-2"}>
                                    <Label htmlFor={"email"} className={error === "Emails do not match" ? "text-red-500" : ""}>Email
                                        Address</Label>
                                    <Input id={"email"} placeholder={"Email Address"} required type={"email"}
                                           value={email} onChange={(e) => setEmail(e.target.value)}/>
                                </div>
                                <div className={"space-y-2"}>
                                    <Label htmlFor={"email2"}
                                           className={error === "Emails do not match" ? "text-red-500" : ""}>Confirm Email</Label>
                                    <Input id={"email2"} placeholder={"Confirm Email"} required type={"email"}/>
                                </div>
                            </div>
                            <div className={"grid grid-cols-2 gap-4"}>
                                <div className={"space-y-2"}>
                                    <Label htmlFor={"password"}
                                           className={error === "Passwords do not match" || error === "Password must be at least 6 characters" ? "text-red-500" : ""}>Password</Label>
                                    <Input id={"password"} placeholder={"Password"} required type={"password"}
                                           value={password} onChange={(e) => setPassword(e.target.value)}/>
                                </div>
                                <div className={"space-y-2"}>
                                    <Label htmlFor={"password2"} className={error === "Passwords do not match" || error === "Password must be at least 6 characters" ? "text-red-500" : ""}>Confirm
                                        Password</Label>
                                    <Input id={"password2"} placeholder={"Confirm Password"} required
                                           type={"password"}/>
                                </div>
                            </div>
                            <Button className={"w-full"} type={"submit"}>Register</Button>
                        </div>
                    </form>
                    <div className={"mt-4"}>
                        <Alert variant={"info"}>
                            <LightningBoltIcon className={"h-4 w-4"}/>
                            <AlertTitle>Need to Login?</AlertTitle>
                            <AlertDescription>Already have an account? <a href={"/login"} style={{
                                textDecoration: "underline",
                                fontWeight: "bold"
                            }}>Click to Login.</a></AlertDescription>
                        </Alert>
                    </div>

                    {error ? (
                        <div className={"mt-4"}>
                            <Alert variant={"destructive"}>
                                <ExclamationTriangleIcon className={"h-4 w-4"}/>
                                <AlertTitle>Warning</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
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

export default Register;
