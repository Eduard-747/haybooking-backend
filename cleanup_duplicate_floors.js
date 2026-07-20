const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/haybooking').then(async () => {
  const branchIdToKeep = "6a2d5b401b18309278ea53e2"; // Branch from the screenshot
  const floorNameToDelete = "First";

  const floorsCollection = mongoose.connection.db.collection('floors');
  const tablesCollection = mongoose.connection.db.collection('tables');

  // Find all "First" floors for this branch
  const duplicateFloors = await floorsCollection.find({ 
    branchId: new mongoose.Types.ObjectId(branchIdToKeep),
    name: floorNameToDelete
  }).toArray();

  let floorsDeleted = 0;
  let tablesDeleted = 0;

  for (const floor of duplicateFloors) {
    // Delete tables for this floor
    const tableRes = await tablesCollection.deleteMany({ floorId: floor._id });
    tablesDeleted += tableRes.deletedCount;
    
    // Delete the floor itself
    await floorsCollection.deleteOne({ _id: floor._id });
    floorsDeleted++;
  }

  console.log(`Deleted ${floorsDeleted} duplicate "${floorNameToDelete}" floors.`);
  console.log(`Deleted ${tablesDeleted} associated tables.`);
  
  process.exit(0);
});
