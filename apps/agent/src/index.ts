import { StateGraph, START, END, Annotation } from "@langchain/langgraph";

const State = Annotation.Root({
  message: Annotation<string>,
});

const graph = new StateGraph(State)
  .addNode("hello", async (state) => {
    return {
      message: `${state.message} → Agent`,
    };
  })
  .addEdge(START, "hello")
  .addEdge("hello", END)
  .compile();

const result = await graph.invoke({
  message: "Hello",
});

console.log(result);
