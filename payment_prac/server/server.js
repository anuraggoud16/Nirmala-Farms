import {app} from "./app.js";
import Razorpay from "razorpay";

export const instance= new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_PASS,
})
app.listen(process.env.PORT, ()=>{
    console.log(`server is working on ${process.env.PORT}`)
})