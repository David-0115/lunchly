/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
    this.fullName = `${firstName} ${lastName}`
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  // fullName() {
  //   return `${this.firstName} ${this.lastName}`
  // }

  static async search(criteria) {
    const result = await db.query(
      `SELECT id, first_name AS "firstName", last_name AS "lastName", phone, notes
        FROM customers
        WHERE first_name || ' ' || last_name
        ILIKE $1`,
      [`%${criteria}%`]
    );

    return result.rows.map(r => new Customer(r))
  }

  static async topTen() {

    const topCustomers = await db.query(
      `SELECT customer_id, COUNT(customer_id) AS reservation_count
       FROM reservations GROUP BY customer_id ORDER BY reservation_count DESC LIMIT $1`, [3]
    );

    const customers = await Promise.all(topCustomers.rows.map(c => Customer.get(c.customer_id)))
    const countLookup = topCustomers.rows.reduce((lookup, item) => {
      lookup[item.customer_id] = item.reservation_count;
      return lookup;
    }, {});

    customers.forEach((customer) => {
      const count = countLookup[customer.id];
      customer.reservations = parseInt(count, 10)
    });
    return customers;
  }
}

module.exports = Customer;
