const express = require('express')
const app = express()
const port = 3005
const bodyParser = require('body-parser')
const { json } = require('body-parser')

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)


const Pool = require('pg').Pool
const pool = new Pool({
  user: 'admin',
  password: 'admin',
  host: 'localhost',
  database: 'ecommerce_db',
  port: 5432,
})

const getUsers = (request, response) => {
    pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
}

app.get('/', getUsers)


  const getUserByName = (request, response) => {
    pool.query('SELECT * FROM users WHERE firstname = $1 or lastname = $1', [request.params.name], (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  }

  app.get('/users/:name', getUserByName)


  const addUser = (request, response) => {
    pool.query('INSERT INTO users (firstname, lastname, email) VALUES ($1, $2, $3) RETURNING *', 
      [request.body.firstname, request.body.lastname, request.body.email], (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  }
  
  app.post('/users/adduser', addUser)



  const updateUser = (request, response) => {
    const id = parseInt(request.params.id)
    const { firstname, lastname, email } = request.body
  
    pool.query(
      'UPDATE users SET firstName = $1, lastName = $2, email = $3 WHERE id = $4 RETURNING *',
      [firstname, lastname, email, id],
      (error, results) => {
        if (results.rowCount === 0) {
          response.send("Hey that user id doesn't exist")
        } else {

        response.status(200).send(`Updated user ${id}`)
        }
      }
    )
  }
  app.put('/users/update/:id', updateUser)


  const deleteUser = (request, response) => {
    const id = parseInt(request.params.id)
  
    pool.query(
      'DELETE FROM users WHERE id = $1', [id], 
      (error, results) => {
        if (results.rowCount === 0) {
          response.send("Hey that user id doesn't exist")
        } else {

        response.status(200).send(`Deleted user ${id}`)
        }
      }
    )
  }

  app.delete('/users/delete/:id', deleteUser)
  
  
  const table_data = [{
	  name:"manufacturer",
	  required_fields:["companyname","contactname","contactemail","contactphonenumber"],
	  all_fields:["companyname","contactname","contactemail","contactphonenumber"]
  },{
	  name:"customer",
	  required_fields:["companyname","customername","customeremail","customerphonenumber"],
	  all_fields:["companyname","customername","customeremail","customerphonenumber"]
  },{
	  name:"item",
	  required_fields:["name","description"],
	  all_fields:["name","description"]
  },{
	  name:"purchaseorder",
	  required_fields:["manufacturerid","itemid","userid","quantity","dateordered"],
	  all_fields:["manufacturerid","itemid","userid","quantity","dateordered","datereceived"]
  },{
	  name:"salesorder",
	  required_fields:["customerid","itemid","userid","quantity","dateordered"],
	  all_fields:["customerid","itemid","userid","quantity","dateordered","datereceived"]
  },];
  
  var RequiredFieldsExist = (body,fields) => {
	  for (var keys of fields) {
		if (!(keys in body)) {
			return false;
		}
	  }
	  return true;
  }
  
  var OutputRequiredFieldNames = (required_fields) => required_fields.reduce((result,field)=>(result==="")?result+=field:result+=","+field,"");
  var OutputSqlArgumentNumbers = (required_fields) => required_fields.reduce((result,field,count)=>(result==="")?result+="$"+(count+1):result+=","+"$"+(count+1),"");
  var OutputBodyData = (body,required_fields) => required_fields.filter((field)=>body[field]!==undefined).map((field)=>body[field]);
  var CountFieldNames = (body,all_fields) => {
	var counter = 0;
	for (var i=0;i<all_fields.length;i++) {
		var field = all_fields[i];
		if (body[field]) {
			counter++;
		}
	}
	return counter;
  }
  var OutputSqlArgumentsAndFieldNames = (body,all_fields) => {
	var finalStr = "";
	var count = 0;
	for (var i=0;i<all_fields.length;i++) {
		var field = all_fields[i];
		if (body[field]) {
			if (finalStr==="") {
				finalStr += field+"=$"+(count+++1) 
			} else {
				finalStr += ","+field+"=$"+(count+++1) 
			}
		}
	}
	return finalStr;
  }
  
  
  
  table_data.forEach((table)=>{
	  app.get("/"+table.name+"/view",(req,res)=>{
		  pool.query('SELECT * FROM '+table.name+' ORDER BY id ASC', (error, results) => {
		  if (error) {
			throw error
		  }
		  res.status(200).json(results.rows)
		})
	  });
	  app.get("/"+table.name+"/view/:id",(req,res)=>{
		  pool.query('SELECT * FROM '+table.name+' where id=$1 ORDER BY id ASC', [req.params.id] , (error, results) => {
		  if (error) {
			throw error
		  }
		  res.status(200).json(results.rows)
		})
	  });
	  app.post("/"+table.name+"/add",
		  (req,res)=>{
	  if (req.body) { 
		if (RequiredFieldsExist(req.body,table.required_fields)) {
			  pool.query('insert into '+table.name+'('+OutputRequiredFieldNames(table.required_fields)+') values('+OutputSqlArgumentNumbers(table.required_fields)+') returning *', OutputBodyData(req.body,table.required_fields) , (error, results) => {
			  if (error) {
				throw error
			  }
			  res.status(200).json(results.rows)
			})
			} else {
				res.status(400).json("Missing a field! Required Fields: "+OutputRequiredFieldNames(table.required_fields));
			}
	  }});
	  app.put("/"+table.name+"/update/:id",
		  (req,res)=>{
		  if (req.body && req.params.id && CountFieldNames(req.body,table.all_fields)>0) { 
		  //console.log([...OutputBodyData(req.body,table.all_fields),Number(req.params.id)])
		  //console.log("update "+table.name+" set "+OutputSqlArgumentsAndFieldNames(req.body,table.all_fields)+" where id=$"+(Object.keys(req.body).length+1)+" returning *")
			  pool.query("update "+table.name+" set "+OutputSqlArgumentsAndFieldNames(req.body,table.all_fields)+" where id=$"+(CountFieldNames(req.body,table.all_fields)+1)+" returning *", [...OutputBodyData(req.body,table.all_fields),req.params.id] , (error, results) => {
				  if (error) {
					throw error
				  }
				  res.status(200).json(results.rows)
			})
		  } else {
			res.status(400).json("Missing id or invalid fields! Valid fields are: "+OutputRequiredFieldNames(table.all_fields));
		  }});
	  app.delete("/"+table.name+"/delete/:id",
		  (req,res)=>{
		  if (req.params.id) { 
			  pool.query("delete from "+table.name+" where id=$1 returning *", [req.params.id] , (error, results) => {
				  if (error) {
					throw error
				  }
				  res.status(200).json(results.rows)
			})
		  } else {
			res.status(400).json("Missing id!")
		  }});
  })




          // console.log(JSON.stringify(results))