// const mockProtect = (req, res, next) => {
//   // 1. HARDCODE A VALID USER ID HERE
//   // Go to your MongoDB, copy the _id of a user you created, and paste it below.
//   // const DEV_USER_ID = "694eb691245b0c865a033a6b"; 
//   const DEV_USER_ID = "694e61ab9868bde446870fc3";
//   console.log(`⚠️ DEV MODE: Skipping Token Check. Acting as user: ${DEV_USER_ID}`);

//   // 2. Inject the fake user into the request
//   req.user = {
//     id: DEV_USER_ID,
//     role: 'User'//'Company' // or 'Company' depending on who you want to test as
    
//   };

//   // 3. Continue to the controller
//   next();
// };

// module.exports = mockProtect;
const mockProtect = (req, res, next) => {

  
  const DEV_USER_ID =
    req.headers['x-dev-user-id'] || "694e61ab9868bde446870fc3";

  const DEV_ROLE =
    req.headers['x-dev-role'] ||  "Company";

  console.log(
    `⚠️ DEV MODE: Acting as ${DEV_ROLE} with ID: ${DEV_USER_ID}`
  );

  // Inject fake authenticated user
  req.user = {
    id: DEV_USER_ID,
    role: DEV_ROLE
  };

  next();
};

module.exports = mockProtect;
