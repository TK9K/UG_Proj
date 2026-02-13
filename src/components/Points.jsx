import React from 'react';
import {endOfWeek, startOfWeek} from "date-fns";

import {db} from "../Firebase.jsx";
import {addDoc, collection, deleteDoc, getDocs, query, updateDoc, where} from "firebase/firestore";


export const createWeek = async (date) => {
        //Function to create a 'week' to store points will need 4
        //DateFNS code to find start and end of the week based on a solution here -- (StackOverflow and 'Freewalker', “How to get first and last day of the current week in JavaScript,” Stack Overflow, Aug. 2020. https://stackoverflow.com/questions/5210376/how-to-get-first-and-last-day-of-the-current-week-in-javascript (accessed Apr. 21, 2024).)

        console.log("Date in: ", date);

        const today = date;

        //WeekStartsOn: 1 --> set week start to mon
        const weekStart = startOfWeek(today, {weekStartsOn: 1});
        const weekEnd = endOfWeek(today, {weekStartsOn: 1});

        console.log("Date FNS...: ", "start: ", weekStart, "end: ", weekEnd);

        return { weekStart, weekEnd };
}

export const storeWeek = async (userId, date) => {
        //Store week based on date provided in relevant firestore collection

        //Replicating functionality of createWeek
        const today = date;

        const weekStart = startOfWeek(today, {weekStartsOn: 1});
        const weekEnd = endOfWeek(today, {weekStartsOn: 1});

        console.log("Week start: ", weekStart, "Week end: ", weekEnd);

        try {
                //Cant have an even number of references in a collection
                //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection - initialise collection
                const pointsCollection = collection(db, "users", userId, "weeklyPoints");
                //Query -- Google Firebase, “Query and filter data | Firestore,” Google Cloud. https://cloud.google.com/firestore/docs/query-data/queries (accessed Apr. 24, 2024). -- also using firebase's GUI Query Builder
                const weekQuery = query(pointsCollection, where("startDate", "==", weekStart));
                const completedQuery = await getDocs(weekQuery);

                //If no week is present create new
                if (completedQuery.empty) {
                        //Create a new week
                        const newWeek = {
                                startDate: weekStart,
                                endDate: weekEnd,
                                points: 0,
                        };
                        //Add new week to doc
                        await addDoc(pointsCollection, newWeek);
                        // currently having to delete a doc as its created twice
                        deleteDoubles(userId, date);
                        return false; //call function again to check week has been created

                } else {
                        console.log("Week with start date: ", weekStart, "and end date: ", weekEnd, "already exists.");
                        //Pass true when the week exists in firestore
                        return true;
                }

        } catch (e) {
                console.error("Error storing week: ", e);
                return false; //try again
        }
}

// Temp fix - Delete the extra created week
const deleteDoubles = async (userId, date) => {

        console.log("DELETE DOUBLES")

        const today = date;

        const weekStart = startOfWeek(today, {weekStartsOn: 1});
        const weekEnd = endOfWeek(today, {weekStartsOn: 1});

        //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection - initialise collection
        const pointsCollection = collection(db, "users", userId, "weeklyPoints");
        //Query -- Google Firebase, “Query and filter data | Firestore,” Google Cloud. https://cloud.google.com/firestore/docs/query-data/queries (accessed Apr. 24, 2024). -- also using firebase's GUI Query Builder
        const weekQuery = query(pointsCollection, where("startDate", "==", weekStart));
        const completedQuery = await getDocs(weekQuery);

        if (completedQuery.docs.length > 1) {
                console.log("More than 1 doc");
                //Select the second query
                const toBeDeleted = completedQuery.docs[1];
                //Get firestore reference and delete
                await deleteDoc(toBeDeleted.ref);
                console.log("Deleted")
        }

}

export const rotateWeeks = () => {
        //Maintain only four weeks in the firestore database

        //Can add total points to a 'lifetime' total, could also have a monthly total
}

export const addPointsToWeek = async (date, userId, points) => {
        //Function to add points to the week

        //Replicating createWeek code
        const today = date;

        const weekStart = startOfWeek(today, {weekStartsOn: 1});
        const weekEnd = endOfWeek(today, {weekStartsOn: 1});

        try {
                //Query for week start
                //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection - initialise collection
                const pointsCollection = collection(db, "users", userId, "weeklyPoints");
                //Query -- Google Firebase, “Query and filter data | Firestore,” Google Cloud. https://cloud.google.com/firestore/docs/query-data/queries (accessed Apr. 24, 2024). -- also using firebase's GUI Query Builder
                const weekQuery = query(pointsCollection, where("startDate", "==", weekStart));
                const completedQuery = await getDocs(weekQuery);

                //Check the relevant week is found
                if (!completedQuery.empty) {
                        //Take and add points
                        const weekDocs = completedQuery.docs[0];
                        //Need a reference to update the value
                        const weekRef = weekDocs.ref;
                        //Get existing points and adding new valye
                        const existingPoints = weekDocs.data().points;
                        const updatedPoints = existingPoints + points;

                        //Updating point value -- based on code from firestore docs Google Firebase, “Add data to Cloud Firestore | Firebase Documentation,” Firebase.  https://firebase.google.com/docs/firestore/manage-data/add-data#update-data (accessed Apr. 23, 2024).
                        await updateDoc(weekRef, {points: updatedPoints});

                        console.log("Updated points for week: ", weekStart, "Old: ", existingPoints, "New: ", updatedPoints);
                } else {
                        console.log("No doc found")
                }

        } catch (e) {
                console.error("Error assigning points: ", e);
        }
}

export const getWeekPoints = async (date, userId) => {
        console.log("Week points called. Date: ", date, "userId: ", userId);
        //Replicating createWeek code
        const today = date;

        const weekStart = startOfWeek(today, {weekStartsOn: 1});
        const weekEnd = endOfWeek(today, {weekStartsOn: 1});

        //Google Firebase, “Get data with Cloud Firestore,” Firebase. https://firebase.google.com/docs/firestore/query-data/get-data (accessed Apr. 23, 2024). - initialise collection - initialise collection
        const pointsCollection = collection(db, "users", userId, "weeklyPoints");
        //Query -- Google Firebase, “Query and filter data | Firestore,” Google Cloud. https://cloud.google.com/firestore/docs/query-data/queries (accessed Apr. 24, 2024). -- also using firebase's GUI Query Builder
        const weekQuery = query(pointsCollection, where("startDate", "==", weekStart));
        const completedQuery = await getDocs(weekQuery);

        console.log("completed query: ", completedQuery);
        //Check not empty
        if (!completedQuery.empty) {
                //Store query data
                const weekData = completedQuery.docs[0].data();
                console.log("Week data: ", weekData, "Week Points: ", weekData.points);
                //Get points and return value
                return weekData.points;
        } else {
                return "!";
        }
}
