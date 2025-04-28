import { task } from "@trigger.dev/sdk/v3";

//1. You need to export each task, even if it's a subtask
export const helloWorld = task({
  //2. Use a unique id for each task
  id: "hello-world",
  //3. The run function is the main function of the task
  run: async (payload: { message: string }) => {
    //4. You can write code that runs for a long time here, there are no timeouts
    console.log(process.env.NODE_ENV)
    console.log(payload.message);
  },
});