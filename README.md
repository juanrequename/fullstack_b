# Full Stack Developer Test - Mercedes-Benz

> [NOTE]
> The 90-minute coding challenge works as expected with all the requirements, as demonstrated in the video. Minor refactors were implemented afterward.

---


▶️ **Watch Demo Video**

[![Watch Demo Video](https://cdn.loom.com/sessions/thumbnails/90a749de5d3048948aa621d7b545288d-92fd3c7343416fde-full-play.gif#t=0.1)](https://www.loom.com/embed/90a749de5d3048948aa621d7b545288d)

---


## API DOCS 
http://localhost:3000/api-docs


---

Welcome to the Backend test for Mercedes-Benz! Below, you will find the instructions to complete the test.

## Setup

`docker compose up -d` to start a docker container with the database.  
`npm install` to install dependencies.  
`npm run dev` to start the project.

## Test Description

The objective of this test is to implement several backend functionalities for managing orders and products. You will need to create endpoints to handle adding products, updating order statuses, generating reports, and searching orders based on specific criteria.

## Instructions

1. **Complete the Table**:

   - Update the existing endpoint to provide the necessary information to complete the table in the frontend.
   - Ensure the table displays the following columns: Order ID, User, Model, Tags, Order Date, Current Status Date, Status, Action, Cancel.

2. **Add Product**:

   - Implement the endpoint to add a new product.
   - Validate the description against the titles from this endpoint: [https://jsonplaceholder.typicode.com/albums](https://jsonplaceholder.typicode.com/albums).
   - Return an error if the description does not match any title.
   - This endpoint should be called from the frontend when the form to create a new car is submitted.

3. **Update Order Status**:

   - Implement the endpoint to update the order status to the next state. The order of the status are: Pending, Shipped, Delivered.
   - This endpoint should be called from the frontend when the Next Step button is clicked.

4. **Generate Report**:

   - Implement the endpoint to generate a report of orders for each product in the last 12 months, grouped by month, year, and state.

   http://localhost:3000/api/orders/report

5. **Search Orders**:

   - Implement an endpoint to search for users who have placed specific orders. There are several filters that can be applied in this endpoint:
     - Product Model (it has to be the same)
     - Product description (partial match is enough)
     - Tags (the car must have at least one of the tags)
     - Start date (orders from this date on)
     - End date (orders before this date)
     - Number of gears (exact match)

## Bonus Points:

- **Unit Test**: Perform a unit test of the front component and the backend files you develop.
- **Refactor**: Any implemented and justified refactor is positively valued.

## Resources

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Express Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Axios Documentation](https://axios-http.com/docs/intro)

## Contact

If you have any questions or need further clarifications, do not hesitate to contact us.

Good luck and happy coding!



