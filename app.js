const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API1

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE
            status = '${status}'
            AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE
            priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE
            status = '${status}';`;
      break;
    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

//API2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const getTodoQueryResponse = await db.get(getTodoQuery);
  response.send(getTodoQueryResponse);
});

//API3

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodoQuery = `INSERT INTO todo(id, todo, priority, status)
  VALUES(
       ${id},
      '${todo}',
      '${priority}',
      '${status}'
  );`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//API4

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodoQueryResponse = await db.get(previousTodoQuery);
  const {
    todo = previousTodoQueryResponse.todo,
    priority = previousTodoQueryResponse.priority,
    status = previousTodoQueryResponse.status,
  } = request.body;

  let updateTodoQuery;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "DONE" || status === "IN PROGRESS" || status === "TO DO") {
        updateTodoQuery = `UPDATE todo 
          SET 
          todo = '${todo}',
          priority = '${priority}',
          status = '${status}'
          WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      }
      break;

    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `UPDATE todo 
          SET 
          todo = '${todo}',
          priority = '${priority}',
          status = '${status}'
          WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      }
      break;

    case requestBody.todo !== undefined:
      updateTodoQuery = `UPDATE todo 
          SET 
          todo = '${todo}',
          priority = '${priority}',
          status = '${status}'
          WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
  }
});

//API5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
