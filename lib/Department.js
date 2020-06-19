class Department {
    id = -1;
    name = "blank";
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }

    static from (data) {
        return new Department(data.id || -1, data.name || "blank"); 
    }
}

module.exports = Department;