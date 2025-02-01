import express, { json, urlencoded } from "express"
import dotenv from "dotenv"
import { dbConn } from "./configs/dbConn.js"
import { UserRoute } from "./routes/userRoutes.js"
import cookieParser from "cookie-parser";
import cors from "cors"
import { CategoryRouter } from "./routes/CategoryRouter.js";
import { productRouter } from "./routes/productsRouter.js";
import { adminRouter } from "./routes/AdminRouter/adminRouter.js";
import { OrderRouetr } from "./routes/orderRouter.js";
import { ContactRouter } from "./routes/contactRouter.js";
import { ratingRouter } from "./routes/ratingRouter.js";


dotenv.config()
const app=express()


dbConn(process.env.db_Url);


const port=process.env.PORT
app.use(json())
app.use(cookieParser());
app.use(urlencoded({extended:true}))
app.use(cors())

app.use("/api", UserRoute);
app.use("/api", CategoryRouter);
app.use("/api", productRouter);
app.use("/api", adminRouter);
 app.use("/api", OrderRouetr); 
 app.use("/api", ContactRouter);
 app.use("/api", ratingRouter);


app.listen(port,()=>{
    console.log(`http://localhost:${port}`)
})


app.get("/",(req,res)=>{
    res.send("Hello World")
})