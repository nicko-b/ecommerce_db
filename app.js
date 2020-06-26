const express = require('express')
const app = express()
const port = 3001
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
  user: 'nick',
  password: 'nb084406',
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
  
  




          // console.log(JSON.stringify(results))