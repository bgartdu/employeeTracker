DROP DATABASE IF EXISTS employee_db;
CREATE DATABASE employee_db;
USE employee_db;

CREATE TABLE department (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(30) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE role (
    id int NOT NULL AUTO_INCREMENT,
    title varchar(30) NOT NULL,
    salary decimal NOT NULL,
    department_id int NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (department_id) REFERENCES department(id)
);

CREATE TABLE employee (
    id int NOT NULL AUTO_INCREMENT,
    first_name varchar(30) NOT NULL,
    last_name varchar(30) NOT NULL,
    role_id int NOT NULL,
    manager_id int,
    PRIMARY KEY (id),
    FOREIGN KEY (role_id) REFERENCES role(id),
    FOREIGN KEY (manager_id) REFERENCES employee(id)
);

INSERT INTO department (name) VALUES ("Sales"); 		#id 1
INSERT INTO department (name) VALUES ("Engineering"); 	#id 2
INSERT INTO department (name) VALUES ("Finance"); 		#id 3
INSERT INTO department (name) VALUES ("Legal"); 		#id 4

INSERT INTO role (title, salary, department_id)
VALUES 
	("Sales Lead", 100000, 1),							#id 1
	("Salesperson", 80000, 1),							#id 2
    ("Lead Engineer", 150000, 2),						#id 3
    ("Software Engineer", 120000, 2),					#id 4
    ("Accountant", 125000, 3),							#id 5
    ("Legal Team Lead", 250000, 4),						#id 6
    ("Lawer", 190000, 4) 								#id 7
;
INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES 
	("John", "Doe", 1, NULL),							#id 1
    ("Mike", "Chan", 2,1),								#id 2
    ("Ashley", "Rodrigues", 3, NULL), 					#id 3
    ("Kevin", "tupik", 4, 3),							#id 4
    ("Malia", "Brown", 5, NULL),						#id 5
    ("Sarah", "Lourd", 6, NULL),						#id 6
    ("Tom", "Allen", 7, 6), 							#id 7
    ("Tammer", "Galal", 4, 4) 							#id 8
;


UPDATE employee SET manager_id=3 WHERE id=1;