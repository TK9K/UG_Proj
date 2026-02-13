import React, {useEffect, useState} from "react";

//ShadCN/UI Components
import {Card, CardHeader, CardTitle, CardContent, CardDescription} from "@/src/components/ui/card.jsx";
import {Input} from "@/src/components/ui/input.jsx";
import {Label} from "@/src/components/ui/label.jsx";
import {Button} from "@/src/components/ui/button.jsx";
import {toast} from "sonner";
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/src/components/ui/input-otp.jsx";

import {getAuth, updateProfile} from "firebase/auth";
import {db} from "@/Firebase.jsx";
import {collection, doc, getDocs, setDoc} from "firebase/firestore";

import {generateShortCode} from "@/components/Utility.jsx";
import Sidebar from "@/components/Sidebar.jsx";
import Topbar from "@/components/Topbar.jsx";

import {CheckIcon, PencilIcon} from "lucide-react";

const Profile = () => {
    const auth = getAuth();
    const user = auth.currentUser;
    const userId = auth.currentUser.uid;

    const [sidebar, setSidebar] = useState(true);

    //Setting variables to current firebase auth values
    const [updatedDisplayName, setUpdatedDisplayName] = useState(user.displayName);
    const [updatedEmail, setUpdatedEmail] = useState(user.email);
    const [updatedPassword, setUpdatedPassword] = useState("");

    //Control whether fields are disabled
    const [updatingDisplayName, setUpdatingDisplayName] = useState(false);
    const [updatingEmail, setUpdatingEmail] = useState(false);
    const [updatingPassword, setUpdatingPassword] = useState(false);

    //Conditionally render options to enable social/show short code
    const [socialEnabled, setSocialEnabled] = useState(false);
    const [userShortCode, setUserShortCode] = useState(null);

    //Open/close sidebar
    const toggleSidebar = () => {
        setSidebar(!sidebar);
    }

    const updateUserProfile = (update) => {
        // Profile update functions based on code from Google Firebase, “Manage Users in Firebase,” Firebase. https://firebase.google.com/docs/auth/web/manage-users (accessed Jan. 25, 2024).
        if (update === "displayName") {
            //Call profile update
            updateProfile(user, {
                //Set new variable
                displayName: updatedDisplayName,
            }).then(() => {
                //If successful
                console.log("Display Name Updated");
            }).catch((error) => {
                //If error
                console.error("Error Updating Display Name", error);
            })
        } else if (update === "email") {
            //Call profile update
            updateProfile(user, {
                //Set variable
                email: updatedEmail,
            }).then(() => {
                //Success
                console.log("Email Updated");
            }).catch((error) => {
                //Error
                console.error("Error Updating Email", error);
            })
        } else if (update === "password") {
            updateProfile(user, {
                password: updatedPassword,
            }).then(() => {
                console.log("Updated password");
            }).catch((error) => {
                console.error("Error updating password", error);
            })
        }
    }

    const enableSocial = async () => {
        try {
            //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
            const socialCollection = collection(db, "users", userId, "social");

            //Call generateShortcode function from utility class
            const shortCode = generateShortCode();

            //Create new socialData variable for storing user's shortcode
            const socialData = {
                shortCode,
                //Empty arrays for friends and requests
                friends: [],
            };
            //Set the social collection to contain the new document
            await setDoc(doc(socialCollection), socialData);
        } catch (e) {
            console.error("Error retriveiving social collection", e);
        }
    }

    useEffect(() => {
        const checkSocialEnabled = async () => {
            try {
                //Find/create the 'social' doc in the users database location -- standard code -- Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection
                const socialCollection = collection(db, "users", userId, "social");
                const query = await getDocs(socialCollection);
                //Fix error if there are multiple by selecting the first document
                const socialDoc = query.docs[0];
                const socialData = socialDoc.data();

                //Check if social collection exists for user
                if (query.size > 0) {
                    //Change whats rendered on the page
                    setSocialEnabled(true);
                    //Finding the users shortcode and setting it
                    setUserShortCode(socialData.shortCode);
                } else {
                    //Change whats rendered on the page
                    setSocialEnabled(false);
                }
            } catch (e) {
                //Debugging statement
                console.error("Error checking if social collection exists: ", e)
            }
        }

        checkSocialEnabled();
        //No dependencies run once on page load
    }, [])

    return (
        <div className="flex w-full h-screen">
            <nav>
                <Sidebar isOpen={sidebar}/>
            </nav>

            <div className={"w-full"}>
                <header>
                    <Topbar currentPage={"Profile"} onToggleSidebar={toggleSidebar}/>
                </header>
                <div className={"p-4 grid gap-2"}>
                    <Card>
                        <CardHeader>
                            <CardTitle className={"text-2xl font-semibold"}>Your Information</CardTitle>
                            <CardDescription>You can edit your information below.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className={"grid grid-cols-2 gap-4 pt-3 pb-3"}>
                                <Label htmlFor={"displayName"}>Display Name</Label>
                                <div className={"flex items-center space-x-2"}>
                                    {/*When updating display name it needs to be updated in the user's teams as well --> search by id --> replace old with new*/}
                                    <Input disabled={!updatingDisplayName} value={updatedDisplayName} placeholder={updatedDisplayName} type={"text"} onChange={(e) => setUpdatedDisplayName(e.target.value)}></Input>
                                    <Button className={""} size={"icon"} variant={"outline"} onClick={() => setUpdatingDisplayName(!updatingDisplayName)}>
                                        {!updatingDisplayName ? (
                                            <div>
                                                <Button className={""} size={"icon"} variant={"outline"} onClick={() => setUpdatingDisplayName(!updatingDisplayName)}>
                                                    <PencilIcon className={"h-4 w-4"}/>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div>
                                                <Button className={""} size={"icon"} variant={"outline"} onClick={() => {
                                                    updateUserProfile("displayName");
                                                    /*Code for creating toasts based on docs -- ShadCN, “Sonner,” ui.shadcn.com. https://ui.shadcn.com/docs/components/sonner (accessed Feb. 28, 2024).*/
                                                toast("Display Name Updated", {
                                                    description: "Your Display Name has been Updated Successfully"
                                                })}}>
                                                    <CheckIcon className={"h-4 w-4 text-green-500"}/>
                                                </Button>
                                            </div>

                                        )}

                                    </Button>
                                </div>
                            </div>
                            <div className={"grid grid-cols-2 gap-4 pt-3 pb-3"}>
                                <Label htmlFor={"email"}>Email Address</Label>
                                <div className={"flex items-center space-x-2"}>
                                    <Input disabled={!updatingEmail} value={updatedEmail} placeholder={updatedEmail} type={"email"} onChange={(e) => setUpdatedEmail(e.target.value)}></Input>
                                    <Button className={""} size={"icon"} variant={"outline"} onClick={() => setUpdatingEmail(!updatingEmail)}>
                                        {!updatingEmail ? (
                                            <div>
                                                <Button className={""} size={"icon"} variant={"outline"} onClick={() => setUpdatingEmail(!updatingEmail)}>
                                                    <PencilIcon className={"h-4 w-4"}/>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div>
                                                <Button className={""} size={"icon"} variant={"outline"} onClick={() => {
                                                    updateUserProfile("email");
                                                    /*Code for creating toasts based on docs -- ShadCN, “Sonner,” ui.shadcn.com. https://ui.shadcn.com/docs/components/sonner (accessed Feb. 28, 2024).*/
                                                    toast("Email Address Updated", {
                                                        description: "Your Email Address has been Updated Successfully"
                                                    })}}>
                                                    <CheckIcon className={"h-4 w-4 text-green-500"}/>
                                                </Button>
                                            </div>

                                        )}
                                    </Button>
                                </div>
                            </div>
                            <div className={"grid grid-cols-2 gap-4 pt-3 pb-3"}>
                                <Label htmlFor={"password"}>Password</Label>
                                <div className={"flex items-center space-x-2"}>
                                    <Input disabled={!updatingPassword} value={updatedPassword} placeholder={"password"} type={"password"} onChange={(e) => setUpdatedPassword(e.target.value)}></Input>
                                    <Button className={""} size={"icon"} variant={"outline"} onClick={() => setUpdatingPassword(!updatingPassword)}>
                                        {!updatingPassword ? (
                                            <div>
                                                <Button className={""} size={"icon"} variant={"outline"} onClick={() => setUpdatingPassword(!updatingPassword)}>
                                                    <PencilIcon className={"h-4 w-4"}/>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div>
                                                <Button className={""} size={"icon"} variant={"outline"} onClick={() => {
                                                    updateUserProfile("password");
                                                    /*Code for creating toasts based on docs -- ShadCN, “Sonner,” ui.shadcn.com. https://ui.shadcn.com/docs/components/sonner (accessed Feb. 28, 2024).*/
                                                    toast("Password Updated", {
                                                        description: "Your Password has been Updated Successfully"
                                                    })}}>
                                                    <CheckIcon className={"h-4 w-4 text-green-500"}/>
                                                </Button>
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className={"text-2xl font-semibold"}>Social</CardTitle>
                            {socialEnabled ? (
                                <CardDescription>You can see your unique shortcode below.</CardDescription>
                            ) : (
                                <CardDescription>You can choose to generate a unique shortcode here so other users can add you as a friend.</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent>
                            {socialEnabled ? (
                                <div className={"flex justify-center"}>
                                    {/*Code for creating the inputOTP component from ShadCN docs -- ShadCN, “Input OTP,” ui.shadcn.com. https://ui.shadcn.com/docs/components/input-otp (accessed Mar. 09, 2024).*/}
                                    <InputOTP maxLength={4} className={"flex justify-center"} value={userShortCode} render={({ slots }) => (
                                        <InputOTPGroup className={"gap-2"}>
                                            {slots.map((slot, index) => (
                                                <InputOTPSlot key={index} {...slot} className={"rounded-md border"}/>
                                            ))}{" "}
                                        </InputOTPGroup>
                                    )}>
                                    </InputOTP>
                                </div>
                            ) : (
                                <div className={"text-center"}>
                                    <Button className={"w-1/2"} onClick={() => {enableSocial();
                                        /*Code for creating toasts based on docs -- ShadCN, “Sonner,” ui.shadcn.com. https://ui.shadcn.com/docs/components/sonner (accessed Feb. 28, 2024).*/
                                    toast("Social Integration Enabled", {
                                        description: "You have enabled social integration, refresh page to see your short code."
                                    })}}>Generate Shortcode</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

    )
}
export default Profile;