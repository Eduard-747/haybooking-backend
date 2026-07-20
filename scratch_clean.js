const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/haybooking').then(async () => {
  const floors = await mongoose.connection.db.collection('floors').find({}).toArray();
  const floorIds = floors.map(f => f._id.toString());
  
  const tablesCollection = mongoose.connection.db.collection('tables');
  const allTables = await tablesCollection.find({}).toArray();
  
  let deletedCount = 0;
  for (const table of allTables) {
    if (!table.floorId || !floorIds.includes(table.floorId.toString())) {
      await tablesCollection.deleteOne({ _id: table._id });
      deletedCount++;
    }
  }
  console.log(`Deleted ${deletedCount} orphan tables.`);
  process.exit(0);
});
