import fs from 'fs';
import path from 'path';

const files = [
  'src/features/services/index.tsx',
  'src/features/service-categories/index.tsx',
  'src/features/treatment-outcomes/index.tsx',
  'src/features/operation-types/index.tsx',
  'src/features/anasthesia-types/index.tsx',
  'src/features/bed-resource-types/index.tsx',
  'src/features/bed-wards/index.tsx',
  'src/features/bed-cabin-types/index.tsx',
  'src/features/doctor-types/index.tsx',
  'src/features/patient-types/index.tsx',
  'src/routes/_authenticated/dashboard/indoor/master/bed-cabin-list/index.tsx'
];

files.forEach(file => {
  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace View button
  const originalView = 'class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"';
  const newView = 'class="inline-flex items-center justify-center rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-8 px-3 transition-colors"';
  content = content.replaceAll(originalView, newView);

  // Replace Edit button
  const originalEdit = 'class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3"';
  const newEdit = 'class="inline-flex items-center justify-center rounded text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm h-8 px-3 transition-colors"';
  content = content.replaceAll(originalEdit, newEdit);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
