const mysql = require("mysql2");
require("dotenv").config();

class MySequelize {
  constructor(connect, tableName) {
    // this.connection = await mysql.createConnection({
    //     host: 'localhost',
    //     user: 'root',
    //     password: process.env.PASSWORD||null,
    //     database: 'db_test',
    //     multipleStatements: true,
    //   });;
    this.connection = connect;
    this.table = tableName;
  }

  async create(obj) {
    await this.connection.query(
      `INSERT INTO ${this.table} SET ?`,
      obj,
      (err, res) => {
        if (err) throw err;
      }
    );
  }

  async bulkCreate(arr) {
    let index = 0;
    let hash = {};
    let load = [];
    let max = Math.max(...arr.map((obj) => Object.keys(obj).length));
    arr.forEach((obj, i, arr) => {
      let providedData = Array(max);
      for (let val in obj) {
        if (hash[val] == null) {
          hash[val] = index;
          index++;
        }
        providedData[hash[val]] = obj[val];
      }
      load.push(providedData);
    });
    let values = Object.keys(hash);
    await this.connection.query(
      `INSERT INTO ${this.table} (${values.join()}) VALUES ?`,
      [load],
      (err, res) => {
        if (err) throw err;
      }
    );
  }

  async findAll(options = {}) {
    let whereClause = "";
    if (options.where) {
      whereClause += "WHERE ";
      let WC = [];
      for (let row in options.where) {
        WC.push(`${row}='${options.where[row]}' `);
      }
      whereClause += WC.join();
      whereClause+=" "
    }
    let orderClause = "";
    if (options.order) {
      if (Array.isArray(options.order[0])) {
        for (let order of options.order) {
          orderClause += "ORDER BY " + order.join(" ") + " ";
        }
      } else {
        orderClause += "ORDER BY " + options.order.join(" ") + " ";
      }
    }
    let limitClause = "";
    if (options.limit) {
      limitClause = "LIMIT " + options.limit;
    }
    let res= await this.connection.query(
      `SELECT * FROM ${this.table} ${whereClause} ${orderClause} ${limitClause};`
    );
    return res[0]
  }

  async findByPk(id) {
    let res=await this.connection.query(`SELECT * FROM ${this.table} WHERE id='${id}';`)
    return res[0]
  }

  async findOne(options={}) {
    let whereClause = "";
    if (options.where) {
      whereClause += "WHERE ";
      let WC = [];
      for (let row in options.where) {
        WC.push(`${row}='${options.where[row]}'`);
      }
      whereClause += WC.join();
      whereClause+=" "
    }
    let res= await this.connection.query(`SELECT * FROM ${this.table} ${whereClause} LIMIT 1;`)
    return res[0]
  }

  async update(newDetsils, options) {
    let whereClause = "";
    if (options.where) {
      whereClause += "WHERE ";
      let WC = [];
      for (let row in options.where) {
        WC.push(`${row}='${options.where[row]}'`);
      }
      whereClause += WC.join();
      whereClause+=" "
    }
    await this.connection.query(`UPDATE ${this.table} SET ? ${whereClause}`, newDetsils)
    /*
            Model.update( { name: 'test6', email: 'test6@gmail.com' } , {
                where: {                                                      // first object containing details to update
                    is_admin: true                                            // second object containing condotion for the query
                }
            })
        */
  }

  async destroy({ force, ...options }) {
    let whereClause = "";
    if (options.where) {
      whereClause += "WHERE ";
      let WC = [];
      for (let row in options.where) {
        WC.push(`${row}='${options.where[row]}'`);
      }
      whereClause += WC.join();
      whereClause+=" "
    }
      if (options.where){
        if (force){
            this.connection.query(
                `DELETE FROM ${this.table} ${whereClause};`
            )
        } else {
            this.update({deleted_at: new Date()}, options)
        }
      } else {
          return `Please specify the data you want to delete`
      }
    /*
            Model.destroy({
                where: {                                                      
                    is_admin: true                                            
                },
                force: true      // will cause hard delete
            })
        */
    /*
           Model.destroy({
               where: {                                                      
                   id: 10                                           
               },
               force: false      // will cause soft delete
           })
       */
    /*
           Model.destroy({
               where: {                                                      
                   id: 10                                           
               },  // will cause soft delete
           })
       */
  }

  async restore(options) {
    this.update({deleted_at: null()}, options)
  }
}

module.exports = { MySequelize };
