class DuplicateUserFound extends Error {
    constructor(message) {
      super(message);
      this.name = "DuplicateUserFound";
    }
}

module.exports={DuplicateUserFound}