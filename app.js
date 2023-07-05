const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const outPutResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;
  switch (true) {
    //scenario 3 hasPriorityAndStatus
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `select * from todo where
              status='${status}' and priority='${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //has category and status scenario 5
    case CategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `select * from todo where
              status='${status}' and category='${category}';`;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //category and priority scenario 7
    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `select * from todo where
             category='${category}' and priority='${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //scenario2
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `select * from todo  where priority='${priority}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //scenario 1

    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `select * from todo  where  status='${status}'  ;`;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //scenario 4
    case hasSearchProperty(request.query):
      getTodosQuery = `select *from todo  where 
            todo like '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachItem) => outPutResult(eachItem)));

    //scenario6
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `select * from todo  where category='${category}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

    //default all todo

    default:
      getTodosQuery = `select * from todo  ;`;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachItem) => outPutResult(eachItem)));
  }
});

//api2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  getTodosQuery = `select * from todo  where id='${todoId}';`;
  data = await db.get(getTodosQuery);
  response.send(outPutResult(data));
});

//api3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const requestQuery = `select * from todo where due_date='${newDate}';`;
    const responseResult = await db.all(requestQuery);
    //console.log(responseResult);
    response.send(responseResult.map((eachItem) => outPutResult(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//api 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `insert into todo(id,todo,priority,status,category,due_date)
                        values( ${id},'${todo}','${priority}','${status}','${category}','${postNewDueDate}');`;
          await db.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  let requestBody = request.body;
  console.log(requestBody);
  const previousTodoQuery = `select * from todo where id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = requestBody;

  let updateTodoQuery;
  switch (true) {
    //update status
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = ` update todo set todo='${todo}',priority='${priority}',status='${status}',
                 category='${category}',due_date='${dueDate}' where id=${todoId};`;

        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //case update priority
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = ` update todo set todo='${todo}',priority='${priority}',status='${status}',
                 category='${category}',due_date='${dueDate}' where id=${todoId};`;

        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //update todo
    case requestBody.todo !== undefined:
      updateTodoQuery = ` update todo set todo='${todo}',priority='${priority}',status='${status}',
                 category='${category}',due_date='${dueDate}' where id=${todoId};`;

      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;

    //case update category
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = ` update todo set todo='${todo}',priority='${priority}',status='${status}',
                 category='${category}',due_date='${dueDate}' where id=${todoId};`;

        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //update due date
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = ` update todo set todo='${todo}',priority='${priority}',status='${status}',
                 category='${category}',due_date='${newDueDate}' where id=${todoId};`;

        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//api 6

app.delete("/todo/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `delete from todo where id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
