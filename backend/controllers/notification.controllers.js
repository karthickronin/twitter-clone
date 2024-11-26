import Notification from "../models/notification.model.js"
import User from "../models/user.model.js"

export const getNotifications = async (req, res) => {
    try{
        const {_id : userId} = req.user
        const user = await User.findById({_id : userId})
        if(!user){
            return res.status(404).json({error : "User not found"})
        }
        const notifications = await Notification.find({to : userId})
        .populate({path : "from",
            select : "username profileImg"
        })
        await Notification.updateMany({to : userId}, {read : true})
        res.status(200).json(notifications)
    }catch(error){
        console.log(`Error in getNotification controller : ${error}`)
        res.status(500).json({error : "Internal server error"})
    }
}
export const deleteNotifications = async (req, res) => {
    try{
        const {_id : userId} = req.user
        const user = await User.findById({_id : userId})
        if(!user){
            return res.status(404).json({error : "User not found"})
        }
        await Notification.deleteMany({to : userId})
        res.status(200).json({"message" : "Notifications deleted successfully"})
    }catch(error){
        console.log(`Error in deleteNotifications controller : ${error}`)
        res.status(500).json({error : "Internal server error"})
    }
}