const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
require("dotenv").config();
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
//use middleware//.......................

app.use(cors());
app.use(express.json());


function verifuJWT(req,res,next){
    const authHeader=req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message:'unauthorized access'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err,decoded) =>{
        if(err){
            return res.status(403).send({message: 'Forbidden access'})
        }
        console.log('decoded',decoded);
        req.decoded = decoded;
    });
    
 
    next();
}





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.foixi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const userCOllection = client.db("sky-gadgets").collection("product");
        app.get('/product',async (req,res)=>{
            const query = {};
            const cursor = userCOllection.find(query)
            const products = await cursor.toArray()
            res.send(products)
        })
        app.post('/getTocken',(req,res)=>{
            const user = req.body;
            const accessToken=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
                expiresIn:'1d'
            });
            res.send({accessToken})
        })

        app.get('/product/:id', async(req,res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await userCOllection.findOne(query);
            res.send(result)
        })
        app.put('/product/:id', async(req,res)=>{
            const id = req.params.id;
            const updatedQuantitytext = req.body.quantity;
            const updatedQuantity= parseInt(updatedQuantitytext)
            const filter = {_id:ObjectId(id)};
            const options = {upsert: true};
            const updateDoc = {
                $set:{
                    quantity:updatedQuantity
                    
                }
            }
            const result = await userCOllection.updateOne(filter,updateDoc,options)
            res.send(result);
        })

        app.post('/product',async(req,res)=>{
            const newItem = req.body
            const result = await userCOllection.insertOne(newItem)
            res.send(result)
        })

        app.delete('/product/:id', async(req,res) =>{
            const id = req.params.id;
            const query ={_id: ObjectId(id)}
            const result = await userCOllection.deleteOne(query);
            res.send(result)
        })
    
// jwt implementation .................................
        app.get('/myproduct', verifuJWT,async (req,res)=>{
            const decodedEmail = req.decoded.email;
            
            const email = req.query.email;
            if(email === decodedEmail){
                const query = {email:email};
                const cursor = userCOllection.find(query)
                const products = await cursor.toArray()
                res.send(products)
            }
            else{
                res.status(403).send({message: 'forbidden access'})
            }
           
        })


    }
    finally{

    }
}
run().catch(console.dir);
app.get('/',(req,res)=>{
    res.send('running my sky-gadgets server')
})
app.listen(port ,()=>{
    console.log('listening to my new port')
})