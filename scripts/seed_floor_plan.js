const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/haybooking').then(async () => {
  console.log('Connected to MongoDB');

  // Find first branch
  const branch = await mongoose.connection.db.collection('branches').findOne({});
  if (!branch) {
    console.error('No branch found');
    process.exit(1);
  }

  const partnerId = branch.partnerId;
  const branchId = branch._id;

  const floorsCollection = mongoose.connection.db.collection('floors');
  const tablesCollection = mongoose.connection.db.collection('tables');

  // We will create a new Floor called "Modern Small Café (10ft x 8ft)"
  const floorName = "Modern Small Café (10ft x 8ft)";

  // Check if it already exists to replace it, or just create a new one
  let floor = await floorsCollection.findOne({ name: floorName, branchId });
  if (floor) {
    console.log(`Replacing existing floor: ${floorName}`);
    // Delete existing tables for this floor
    await tablesCollection.deleteMany({ floorId: floor._id });
    await floorsCollection.deleteOne({ _id: floor._id });
  }

  const newFloorId = new mongoose.Types.ObjectId();

  const elements = [
    // --- Walls ---
    // Top wall
    { id: 'wall_1', type: 'wall', x: 0, y: 0, width: 600, height: 10, rotation: 0, color: '#475569' },
    // Bottom wall (split for entrance)
    { id: 'wall_2', type: 'wall', x: 0, y: 470, width: 50, height: 10, rotation: 0, color: '#475569' },
    { id: 'wall_3', type: 'wall', x: 130, y: 470, width: 470, height: 10, rotation: 0, color: '#475569' },
    // Left wall
    { id: 'wall_4', type: 'wall', x: 0, y: 10, width: 10, height: 460, rotation: 0, color: '#475569' },
    // Right wall
    { id: 'wall_5', type: 'wall', x: 590, y: 10, width: 10, height: 460, rotation: 0, color: '#475569' },

    // --- Windows & Doors ---
    // Large window on top wall
    { id: 'window_1', type: 'window', x: 100, y: 0, width: 200, height: 10, rotation: 0 },
    // Entrance Door (bottom)
    { id: 'door_1', type: 'door', x: 50, y: 470, width: 80, height: 10, rotation: 0 },
    // Kitchen door (top right)
    { id: 'door_2', type: 'door', x: 400, y: 0, width: 80, height: 10, rotation: 0 },

    // --- Reception & Waiting Area ---
    // Reception stand near entrance
    { id: 'reception_1', type: 'reception_desk', x: 150, y: 400, width: 80, height: 50, rotation: 0 },
    // Waiting area sofa/bench along the left wall
    { id: 'waiting_1', type: 'sofa', x: 20, y: 350, width: 100, height: 60, rotation: 90 },

    // --- Decor ---
    { id: 'plant_1', type: 'plant', x: 20, y: 20, width: 50, height: 50, rotation: 0 }, // Top left
    { id: 'plant_2', type: 'plant', x: 520, y: 20, width: 50, height: 50, rotation: 0 }, // Top right
    { id: 'plant_3', type: 'plant', x: 520, y: 400, width: 50, height: 50, rotation: 0 }, // Bottom right near reception
    { id: 'plant_4', type: 'plant', x: 20, y: 420, width: 40, height: 40, rotation: 0 }, // Near entrance

    // --- Accessibility ---
    { id: 'wheelchair_1', type: 'wheelchair', x: 50, y: 250, width: 40, height: 40, rotation: 0 }, // Showing accessible path

    // --- Labels ---
    { id: 'label_1', type: 'label', text: 'Dining Area', x: 250, y: 20, width: 120, height: 30, rotation: 0 },
    { id: 'label_2', type: 'label', text: 'Waiting Area', x: 30, y: 300, width: 120, height: 30, rotation: 90 },
    { id: 'label_3', type: 'label', text: 'Kitchen / Bar', x: 400, y: 30, width: 120, height: 30, rotation: 0 },
    { id: 'label_4', type: 'label', text: 'Reception', x: 140, y: 360, width: 100, height: 30, rotation: 0 }
  ];

  // Insert Floor
  await floorsCollection.insertOne({
    _id: newFloorId,
    partnerId,
    branchId,
    name: floorName,
    order: 0,
    dimensions: { width: 600, height: 480 },
    areas: [],
    elements: elements,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0
  });

  // Insert Tables
  const tables = [
    // Table 1: Round, 4 people (center/top)
    {
      _id: new mongoose.Types.ObjectId(),
      partnerId,
      branchId,
      floorId: newFloorId,
      tableNumber: "T1",
      capacity: 4,
      minCapacity: 1,
      shape: "round",
      position: { x: 250, y: 120 },
      size: { width: 90, height: 90 },
      rotation: 0,
      status: "available",
      location: "indoor",
      isVip: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    },
    // Table 2: Square, 2 people (left side)
    {
      _id: new mongoose.Types.ObjectId(),
      partnerId,
      branchId,
      floorId: newFloorId,
      tableNumber: "T2",
      capacity: 2,
      minCapacity: 1,
      shape: "square",
      position: { x: 120, y: 220 },
      size: { width: 70, height: 70 },
      rotation: 0,
      status: "available",
      location: "indoor",
      isVip: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    },
    // Table 3: Square, 2 people (right side)
    {
      _id: new mongoose.Types.ObjectId(),
      partnerId,
      branchId,
      floorId: newFloorId,
      tableNumber: "T3",
      capacity: 2,
      minCapacity: 1,
      shape: "square",
      position: { x: 380, y: 220 },
      size: { width: 70, height: 70 },
      rotation: 0,
      status: "available",
      location: "indoor",
      isVip: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    }
  ];

  await tablesCollection.insertMany(tables);

  console.log(`Successfully created floor plan: ${floorName}`);
  console.log(`Added 3 tables to the layout.`);

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
