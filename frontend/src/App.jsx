import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/auth/login/LoginPage";
import SignUpPage from "./pages/auth/signup/SignUpPage";
import NotificationPage from "./pages/notification/Notification";
// import CreatePost from "./pages/home/CreatePost";
import Sidebar from "./components/common/Sidebar.jsx";
import RightPanel from "./components/common/RightPanel.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";
import {Toaster} from "react-hot-toast"
import { useQuery } from "@tanstack/react-query";
import { baseUrl } from "./constant/url.js";
import LoadingSpinner from "./components/common/LoadingSpinner.jsx";

function App() {
  const {data: authUser, isLoading} = useQuery({
    queryKey : ["authUser"],
    queryFn : async () => {
      try {
        const  res = await fetch(`${baseUrl}/api/auth/me`,{
          method : "GET",
          credentials : "include",
          headers : {
            "Content-type" : "application/json"
          }
        })
      const data = await res.json()
      if (data.error) {
        return null
      }
      if(!res.ok){
        throw new Error(data.error || "Something went wrong");
      }
      return data
      } catch (error) {
        throw error
      }
    },
    retry: false
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  return (
    <div className="flex max-w-6xl mx-auto">
      {authUser && <Sidebar />}
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to= "/login"/>} />
        <Route path="/signup" element={!authUser?<SignUpPage />:<Navigate to="/"/>} />
        <Route path="/login" element={!authUser?<LoginPage />:<Navigate to="/"/>} />
        <Route path="/notifications" element={authUser?<NotificationPage />:<Navigate to = "/"/>} />
        <Route path="/profile/:username" element={authUser?<ProfilePage />:<Navigate to="/"/>} />
      </Routes>
      {/* <CreatePost /> */}
     {authUser && <RightPanel />}
      <Toaster />
    </div>
  );
}
export default App;
