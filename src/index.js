import dotenv from "dotenv"
import http from "http";
import mongoose from "mongoose"
import connectDB from "./db/index.js"
import app from "./app.js"

dotenv.config({
    path:"/env"
})

// Create HTTP Server
const server = http.createServer(app);

connectDB()
.then( () => {
   app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT}`)
   })
})
.catch((error) => {
    console.log("MONGODB connection failed !!!", error)
})


export { server };