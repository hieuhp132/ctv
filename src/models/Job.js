class Job {
    constructor(title, salary, location, description, requirements, benefits, other) {
        this.title = title;
        this.salary = salary;
        this.location = location;
        this.description = description;
        this.requirements = requirements;
        this.benefits = benefits;
        this.other = other;
        this.isActive = true;
        this.applicant = 0;
        this.reward = 500; // Default reward
    }
}
