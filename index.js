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
      whereClause += " ";
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
    let attributesClause = "*";
    if (options.attributes) {
      if (options.attributes.length > 0) {
        let AC = [];
        for (let attribute of options.attributes) {
          if (Array.isArray(attribute)) {
            AC.push(`${attribute[0]} as ${attribute[1]}`);
          } else {
            AC.push(attribute);
          }
        }
        attributesClause = AC.join(", ");
      }
    }

    let res = await this.connection.query(
      `SELECT ${attributesClause} FROM ${this.table} ${whereClause} ${orderClause} ${limitClause};`
    );

    if (options.include) {
      let resultPlusINclude = await Promise.all(
        res[0].map(async (obj) => {
          const joiner = await this.connection.query(
            `SELECT * FROM ${options.include[0].table} WHERE ${
              options.include[0].tableForeignKey
            }=${obj[options.include[0].sourceForeignKey]}`
          );
          obj[options.include[0].table] = joiner[0];
          return obj;
        })
      );
      return resultPlusINclude;
    }
    return res[0];
  }

  async findByPk(id) {
    let res = await this.connection.query(
      `SELECT * FROM ${this.table} WHERE id='?';`,
      id
    );
    return res[0];
  }

  async findOne(options = {}) {
    let whereClause = "";
    if (options.where) {
      whereClause += "WHERE ";
      let WC = [];
      for (let row in options.where) {
        WC.push(`${row}='${options.where[row]}'`);
      }
      whereClause += WC.join(" AND ");
      whereClause += " ";
    }
    let attributesClause = "*";
    if (options.attributes) {
      if (options.attributes.length > 0) {
        let AC = [];
        for (let attribute of options.attributes) {
          if (Array.isArray(attribute)) {
            AC.push(`${attribute[0]} as ${attribute[1]}`);
          } else {
            AC.push(attribute);
          }
        }
        attributesClause = AC.join(", ");
      }
    }
    if (options.attributes) console.log(`SELECT ${attributesClause} FROM ${this.table} ${whereClause} LIMIT 1;`)
    let res = await this.connection.query(
      `SELECT ${attributesClause} FROM ${this.table} ${whereClause} LIMIT 1;`
    );
    return res[0];
  }

  async update(newDetsils, options) {
    let whereClause = "";
    if (options.where) {
        let opUsed = Reflect.ownKeys(options.where); // All keys including symbols
        whereClause = " WHERE ";
        //Creating an array containing trios of [key,value,operator]
        let keyValuesOp = opUsed.map((op) =>
        
          typeof op === "symbol"
            ? [Object.entries(options.where[op]), Symbol.keyFor(op)].flat(2)
            : [op, options.where[op], "="]
        );
        console.log(keyValuesOp)
        //Converting the array into sql clause: for[id,5,>]->id>5
        whereClause += keyValuesOp
          .map(
            (trio) =>
              `${trio[0]}${trio[2]}${
                isNaN(trio[1]) ? `'${trio[1]}'` : trio[1]
              } AND`
          )
          .join(" ")
          .slice(0, -3);

        
      }
    
    
    
    // if (options.where) {
    //   whereClause += "WHERE ";
    //   let WC = [];
    //   for (let row in options.where) {
    //     console.log(row)
    //     WC.push(`${row}='${options.where[row]}'`);
    //   }
    //   whereClause += WC.join(" AND ");
    //   whereClause += " ";
    // }
    await this.connection.query(
      `UPDATE ${this.table} SET ? ${whereClause}`,
      newDetsils
    );
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
      whereClause += " ";
    }
    if (options.where) {
      if (force) {
        this.connection.query(`DELETE FROM ${this.table} ${whereClause};`);
      } else {
        this.update({ deleted_at: new Date() }, options);
      }
    } else {
      return `Please specify the data you want to delete`;
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

  async restore(options={}) {
    this.update({ deleted_at: null }, options);
  }
}

module.exports = { MySequelize };
