const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nimqptwgvatvlvhvugdf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pbXFwdHdndmF0dmx2aHZ1Z2RmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjU0NDQ0MywiZXhwIjoyMTAyMTIwNDQzfQ.uoRyakjys11sbNtJ5GwxbTkjgRGU-cuLTXPX2KYrPZs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching classes...');
  const { data: classes, error: cErr } = await supabase.from('classes').select('*').order('name', { ascending: true });
  if (cErr) {
    console.error('Error fetching classes:', cErr);
    return;
  }
  console.log('Classes found:', classes);

  if (!classes || classes.length === 0) {
    console.log('No classes found in DB. Creating default classes: Kelas 7A, Kelas 8A, Kelas 9A...');
    const { data: newClasses, error: initErr } = await supabase.from('classes').insert([
      { name: 'Kelas 7A', grade: 7, code: 'K7A' },
      { name: 'Kelas 8A', grade: 8, code: 'K8A' },
      { name: 'Kelas 9A', grade: 9, code: 'K9A' }
    ]).select();

    if (initErr) {
      console.error('Failed to create default classes:', initErr);
      return;
    }
    classes.push(...newClasses);
  }

  console.log('Fetching student profiles...');
  const { data: students, error: sErr } = await supabase.from('profiles').select('*').eq('role', 'student');
  if (sErr) {
    console.error('Error fetching students:', sErr);
    return;
  }
  console.log(`Total students found: ${students.length}`);

  let updatedCount = 0;
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    // Assign student evenly across available classes (7, 8, 9)
    const targetClass = classes[i % classes.length];
    console.log(`Assigning student ${s.full_name || s.email} to class ${targetClass.name} (id: ${targetClass.id})`);

    const { error: uErr } = await supabase.from('profiles').update({
      class_id: targetClass.id,
      updated_at: new Date().toISOString()
    }).eq('id', s.id);

    if (uErr) {
      console.error(`Failed to update ${s.id}:`, uErr.message);
    } else {
      updatedCount++;
    }
  }

  console.log(`Successfully assigned ${updatedCount} students to classes!`);
}

main();
