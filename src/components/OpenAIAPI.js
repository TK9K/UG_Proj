import OpenAI from "openai";
import config from "../OpenAIApiKey";

// Have to temporarily disable browser security to use the API at the moment as it doesn't want the key to be publicly available
const openai = new OpenAI({apiKey: config.OPENAI_API_KEY, dangerouslyAllowBrowser: true});

export const subtasksGenerate = async (subtask) => {
    console.warn("SUBTASK GENERATE CALLED")

    //Based on code from - OpenAI, “Chat Completions API,” platform.openai.com. https://platform.openai.com/docs/guides/text-generation/chat-completions-api (accessed Apr. 19, 2024).
    const completion = await openai.chat.completions.create({
        messages: [
            {
                //Telling the model what i want it to do
                role: "system",
                content: "I will provide you a task and a value (between 1-10) suggesting the extent to which you should break the larger overall task into smaller subtasks, you should return in JSON format a list of subtasks based on the provided task and value. The user will be able to select which of these subtasks they wish to use so there should be no sub tasks that refer to another task in the breakdown. DO NOT return anything except this JSON; DO NOT include generic instructions such as 'repeat steps...' in any suggestions. ONLY return ONE subtasks array"
            },
            {
                //Users task is passed here along with a value which can be adjusted (may add this option later in code)
                role: "user",
                content: `TASK: ${subtask} VALUE: 5`
            },
        ],
        model: "gpt-3.5-turbo",
    });
    console.log("Subtask passed: ", subtask)
    console.log("RESPONSE: ", completion.choices[0].message.content);
    //Returning the models response
    return completion.choices[0].message.content;
}

export const pointsGenerate = async (task, subtasks) => {
    console.warn("POINTS GENERATE CALLED")
    console.log("Task: ", task)
    console.log("Subtasks: ", subtasks)

    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "I will provide you with a task from which you will derive a number of points to, based on the perceived complexity of the task, ideally in multiples of 10 at minimum. I will also on some occasions pass an array of subtasks along with this you should assign individual points to the subtasks array totalling that of the main task. It is important that the assignment of points is fair and makes sense based on the complexity of the task. You should return a JSON containing the task and the points you have chosen to assign to it. As well as a subtasks array that contains a series of objects in the format text: ..., points: ..."
            },
            {
                role: "user",
                content: `TASK: ${task}, SUBTASKS:${subtasks}`
            },
        ],
        model: "gpt-3.5-turbo",
    });
    console.log("TASK TITLE: ")
    console.log("Response: .....", completion.choices[0].message.content);

    return completion.choices[0].message.content;
}