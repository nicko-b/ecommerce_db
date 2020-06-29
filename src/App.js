import React,{useState,useEffect} from 'react';
import logo from './logo.svg';
import './App.css';

var md5 = require('md5');
var axios = require('axios');
var moment = require('moment');

const DisplayRegisterForm = (p)=>{
  const [userType,setUserType] = useState("Customer");
  const [registerState,setRegisterState] = useState("REGISTER");
  const [status,setStatus] = useState("Contacting Server...");
  const [contents,setContents] = useState("");
  const [errorMessage,setErrorMessage] = useState("");

  var fields = {
    "Customer":[
      {name:"Company Name",value:"companyname"},
      {name:"Name",value:"customername"},
      {name:"Email",value:"customeremail"},
      {name:"Phone Number",value:"customerphonenumber"},],
    "User":[
      {name:"First Name",value:"firstname"},
      {name:"Last Name",value:"lastname"},
      {name:"Email",value:"email"},],
    "Manufacturer":[
      {name:"Company Name",value:"companyname"},
      {name:"Contact Name",value:"contactname"},
      {name:"Contact Email",value:"contactemail"},
      {name:"Contact Phone Number",value:"contactphonenumber"},],
  }

  //var contents;
  //var errorMessage;

  var RegisterUser = ()=>{
    //First add a new customer/manufacturer/user

    var convertName = (type)=>{
      if (type!=="User") {
        return userType[0].toLowerCase()+userType.slice(1)
      } else {
        return "users"
      }
    }

    var myObj = {}
    var myData = {}
    var uniqueid = undefined;
    fields[userType].forEach((field)=>myObj[field.value]=document.getElementById(field.name).value)
    //console.log(myObj)
    axios.get('http://localhost:3001/login/'+p.username)
    .then((data)=>{
      //setRegisterState("SERVER_CONTACT");
      setStatus("Preparing Account...");
      console.log(data.data)
      if (data.data.length>0) {
        return Promise.reject(new Error("Duplicate user detected"));
      } else {
        if (userType==="User") {
          return axios.post('http://localhost:3001/'+convertName(userType)+'/adduser',myObj)
        } else {
          return axios.post('http://localhost:3001/'+convertName(userType)+'/add',myObj)
        }
      }
    })
    .then((data)=>{
      //console.log(JSON.stringify(data));
      //data.id
      //setStatus(data);
      //myData = JSON.stringify(data);
      setStatus("Registering Account...");
      var uniqueid = data.data[0].id;
      var myObj = {uniqueid:uniqueid,username:p.username,password:md5(p.password),role:userType}
      return axios.post("http://localhost:3001/logininfo/add",myObj)
    })
    .then((data)=>{
      //console.log(data)
      setStatus("Your account has been successfully registered! Please try logging in! (You will be redirected to the login page...)");
      p.setPassword("")
      p.setLoginPageMessage("Your account has been successfully registered! Please try logging in!")
      p.setReloadUserDatabase(true)
      p.setPageView("LOGIN")
    })
    .catch((err)=>{
      setRegisterState("REGISTER");
      setContents(<>
        <h2 style={{color:"red"}}>{err.message}</h2>
      </>);
    });
    //Then register a new user using the returned ID.
  }

  function Validated() {
    var inputs = document.getElementsByTagName("input");
    setErrorMessage("")
    for (var i=0;i<inputs.length;i++){var input=inputs[i]; input.classList.remove("error")}
    
    var empty_inputs = [] 
    for (var i=0;i<inputs.length;i++) {var input=inputs[i]; if (input.value.length===0){empty_inputs.push(input)}};

    if (empty_inputs.length>0) {
      setErrorMessage(<>
        <h2 style={{color:"red"}}>Please fix invalid fields!</h2>
      </>);
      for (var i=0;i<empty_inputs.length;i++){var input=empty_inputs[i]; input.classList.add("error")}
      return false;
    } else {
        return true;
    }
  }
  
  if (registerState!=="SERVER_CONTACT") {
    return (
      <>
      <div className="offset-md-3 col-md-6">
          {errorMessage}
          {contents}
          <h2>Register</h2><br/>
          <label for="type">User Type:</label>
          <select onChange={(e)=>{setUserType(e.currentTarget.value)}} value={userType} name="type" id="type">
            <option value="Customer">Customer</option>
            <option value="User">User</option>
            <option value="Manufacturer">Manufacturer</option>
            </select><br/><br/>
            {fields[userType].map((field)=><><br/><label for={field.name}><b>{field.name}:</b></label><input type="text" name={field.name} id={field.name}/></>)}
            <br/><br/>
            <label for="username"><b>Username:</b></label><input type="text" onChange={(e)=>{p.setUsername(e.currentTarget.value)}} id="username" name="username"/><br/>
            <label for="password"><b>Password:</b></label><input type="password" onChange={(e)=>{p.setPassword(e.currentTarget.value)}} id="password" name="password"/><br/><br/>
            <button onClick={()=>{if (Validated()) {
              RegisterUser();
              setRegisterState("SERVER_CONTACT")
            }}}>Register</button>
      </div>
      </>
    );
  } else {
    return (
      <>
      <div className="offset-md-3 col-md-6">
      <h2>Registering new {userType}</h2>
      {status}
      </div>
      </>
    )
  }
}

const DisplayLoginForm = (p)=>{
  const [status,setStatus] = useState("Contacting Server...")
  var contents = null;

  var LoginUser = ()=>{
    axios.get("http://localhost:3001/login/"+p.username+"/"+md5(p.password))
    .then((data)=>{
      //setStatus(JSON.stringify(data))
      if (Array.isArray(data.data) && data.data.length>0) {
        //The first value should hold our uniqueid plus our role type.
        p.setRole(data.data[0].role)
        p.setUniqueId(data.data[0].uniqueid)
        setStatus("Found your data... Sending you to "+data.data[0].role+" homepage.")
        p.setPageView(data.data[0].role.toUpperCase())
      } else {
        Promise.reject("Invalid Username/Password Combination!")
      }
    })
    .catch((err)=>{
      setStatus(err.message);
      p.setLoginState("COULDNOTCONNECT")
    })
  }

  var VerifyFormInputs = ()=>{
    if (p.username && p.password && p.username.length>0 && p.password.length>0) {
      p.setLoginState("LOGGING IN")
      p.setLoginPageMessage("")
      LoginUser();
    } else {
      p.setLoginState("INVALID")
    }
  }

  switch (p.loginState) {
    case "FAILED":{
      contents = <h3 style={{color:"red"}}>Incorrect Credentials!</h3>;
    }break;
    case "COULDNOTCONNECT":{
      contents = <h3 style={{color:"red"}}>Could not contact server! Please try again!</h3>;
    }break;
    case "INVALID":{
      contents = <h3 style={{color:"red"}}>Please provide a valid username and password!</h3>;
    }break;
  }

  if (p.loginState!=="LOGGING IN") {
    return (
      <>
        {contents}
        <div className="offset-md-3 col-md-6">
        <h2>Login</h2><br/>
        <label for="username"><b>Username: </b></label>
        <input type="text" name="username" id="username" onChange={(e)=>{p.setUsername(e.currentTarget.value)}} value={p.username}/>
        <br/><br/>
        <label for="password"><b>Password: </b></label>
        <input type="password" name="password" id="password" onChange={(e)=>{p.setPassword(e.currentTarget.value)}} value={p.password}/>
        <br/><br/>
        <input type="submit" onClick={()=>{VerifyFormInputs()}} value="Login"/>
        <br/><br/>
        <span className="link" onClick={()=>{p.setPageView("REGISTER")}}>Need an account?</span>
      </div>
      </>
    );
  } else {
    return (
      <>
      <h2>Logging you in...</h2>
      {status}
      </>
    );
  }
}

const Item = (p)=>{
  var contents;
  if (p.items) {
    var thisItem = p.items.filter((item)=>item.id==p.id)[0];
    if (thisItem) {
      contents=<>
      <div className="row">
        <div className="col-md-4">
          <b>{thisItem.name}</b>
        </div>
        <div className="col-md-8">
          {thisItem.description}
        </div>
      </div>
      </>;
    } else {
      contents = "Could not find item "+p.id
    }
  }
    return (
      <>
        {contents}
      </>
    )
}

const SalesOrder = (p)=>{
  return (
    <>
    {<Item id={p.id} items={p.items}/>}x{p.order.quantity} - <b>Submitted </b> {p.order.dateordered} - {(p.order.datereceived)?p.order.datereceived:"Order Pending..."}
  </>
  )
}

const ItemsSelectionList = (p)=>{
  return (
    <>
    <select name="item" id="item" value={p.itemId} onChange={(e)=>{p.setItemId(e.currentTarget.value);}}>
       {p.items.map((item)=><option value={item.id}>{item.name}</option>)}
    </select>
    </>
  );
}

const UsersSelectionList = (p)=>{
  return (
    <>
    <select name="user" id="user" value={p.userId} onChange={(e)=>{p.setUserId(e.currentTarget.value);}}>
       {p.users.map((user)=><option value={user.id}>[{user.id}] {user.firstname+" "+user.lastname}</option>)}
    </select>
    </>
  );
}

const CreateCustomerSalesOrder = (p)=>{
  const [itemId,setItemId] = useState(p.items[0].id);
  const [itemQuantity,setItemQuantity] = useState(1);
  const [userId,setUserId] = useState(p.users[0].id);
  const [status,setStatus] = useState(null);
  const [lastError,setLastError] = useState(null);

  function SubmitSalesOrder(){
    setStatus("Submitting Sales Order...");
    var obj = {customerid:p.id,itemid:itemId,userid:userId,quantity:itemQuantity,dateordered:moment().format()}
    axios.post("http://localhost:3001/salesorder/add",obj)
    .then((data)=>{
      if (Array.isArray(data.data) && data.data.length>0) {
        //Successfully submitted order.
        setStatus("Order submitted! Returning back to orders page...")
        p.setPage(null);
      } else {
        Promise.reject("Order failed to submit!")
        setStatus(null)
      }
    })
    .catch((err)=>{
      setLastError(err.message)
      setStatus(null)
    })
  }

  if (status===null) {
    return (
      <>
        {lastError}
        <button onClick={()=>{p.setPage(null);}}>{"< Back"}</button>
        <br/><br/>
        <label for="item"><b>Requested Item:</b></label><ItemsSelectionList itemId={itemId} setItemId={setItemId} items={p.items}/> <label for="quantity"><b>Quantity:</b></label> x<input type="number" style={{width:"60px"}} name="quantity" id="quantity" value={itemQuantity} onChange={(e)=>{setItemQuantity(e.currentTarget.value)}}/>
        <Item id={itemId} items={p.items}/>
        <br/><br/>
        <label for="user"><b>Sales User:</b></label><UsersSelectionList users={p.users} userId={userId} setUserId={setUserId}/>
        <button onClick={()=>{SubmitSalesOrder()}}>Submit</button>
      </>
    )
  } else {
    return (
      <>
        {status}
      </>
    )
  }
}

const DisplayCustomerOrders = (p)=>{
  const [status,setStatus] = useState("Fetching orders...");
  const [orders,setOrders] = useState([]);
  const [reload,setReload] = useState(true);

  var FetchOrders = ()=>{
    axios.get("http://localhost:3001/salesorder/bycustomerid/"+p.id)
    .then((data)=>{
      setOrders(data.data);
      setStatus("Done! ("+data.data.length+") orders found.")
    })
  }

  if (reload) {
    FetchOrders();
    setReload(false)
  }

  return(
    <>
    <div className="row">
      <div className="offset-md-8 col-md-4">
        <button onClick={()=>{p.setPage("PLACEORDER")}}>New Sales Order +</button>
      </div>
    </div>
    <div className="row">
      <div className="col-md-12">
      {status}
      {orders.map((order)=><SalesOrder order={order} id={order.itemid} items={p.items}/>)}
      </div>
    </div>
    </>
  )
}

const CustomerPage = (p)=>{
  const [page,setPage] = useState(null); //This view has 3 pages: View orders, place orders, view / edit profile

  var contents;

  switch (page) {
    case "PLACEORDER":{
      contents=<CreateCustomerSalesOrder items={p.items} id={p.id} users={p.users} setPage={setPage}/>;
    }break;
    case "PROFILE":{

    }break;
    default:{
      contents=<DisplayCustomerOrders setPage={setPage} id={p.id} items={p.items}/>;
    }
  }

  return (
    <>
      {contents}
    </>
  );
}

function App() {
  const [itemDatabase,setItemDatabase] = useState([]);
  const [userDatabase,setUserDatabase] = useState([]);
  const [password,setPassword] = useState(null);
  const [username,setUsername] = useState(null);
  const [uniqueid,setUniqueId] = useState(null);
  const [role,setRole] = useState(null);
  const [loginState,setLoginState] = useState(null);
  const [pageView,setPageView] = useState("LOGIN");
  const [loginPageMessage,setLoginPageMessage] = useState("");
  const [reloadItemDatabase,setReloadItemDatabase] = useState(true);
  const [reloadUserDatabase,setReloadUserDatabase] = useState(true);

  if (reloadItemDatabase) {
    axios.get("http://localhost:3001/item/view")
    .then((data)=>{
      setItemDatabase(data.data);
      setReloadItemDatabase(false);
    })
  }
  if (reloadUserDatabase) {
    axios.get("http://localhost:3001/")
    .then((data)=>{
      setUserDatabase(data.data);
      setReloadUserDatabase(false);
    })
  }

  var contents = null;

  switch (pageView) {
    case "LOGIN":{
      contents=
      <>
      <h3>{loginPageMessage}</h3>
      <DisplayLoginForm setUniqueId={setUniqueId} role={role} setRole={setRole} setLoginPageMessage={setLoginPageMessage} setPageView={setPageView} setUsername={setUsername} setPassword={setPassword} setLoginState={setLoginState} loginState={loginState} username={username} password={password} />
      </>
      ;
    }break;
    case "REGISTER":{
      contents=
      <>
      <DisplayRegisterForm setReloadUserDatabase={setReloadUserDatabase} setPageView={setPageView} setLoginPageMessage={setLoginPageMessage} username={username} password={password} setUsername={setUsername} setPassword={setPassword}/>
      </>
    }break;
    case "MANUFACTURER":{
      contents=<div className="col-md-12">
      <h3>This is the Manufacturer's Page!</h3>
      </div>;
    }break;
    case "USER":{
      contents=<div className="col-md-12">
      <h3>This is the User's Page!</h3>
      </div>;
    }break;
    case "CUSTOMER":{
      contents=<div className="col-md-12">
      <h3>Customer Dashboard</h3>
      <CustomerPage id={uniqueid} items={itemDatabase} users={userDatabase} />
      </div>;
    }break;
  }

  return (
    <>
    <div className="container">
    <div className="row pt-5 pb-5 card border text-center">
      {contents}
    </div>
    </div>
    </>
  );
}

const DisplayUserOrderForm = (p)=>{

  
  
}

export default App;
