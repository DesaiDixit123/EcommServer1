import { connect } from "mongoose"

export const dbConn=async(URL)=>{
  try {
    await connect(URL)
    console.log("Connected to Mongodb")
  } catch (error) {
    console.log(error)
    
  }

}