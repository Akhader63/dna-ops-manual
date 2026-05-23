const SUPABASE_URL = "https://ocgqvncgcbbdnpsuxona.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ3F2bmNnY2JiZG5wc3V4b25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MjcxNTMsImV4cCI6MjA5MzMwMzE1M30.o0tA40y52m1CwygY7LTYfBhZMeYH1USLtjbPhf07HXY";

async function verifyModules() {
  console.log("=== Verifying Modules Data ===\n");
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/modules?select=code,name,category,is_active,depends_on&order=sort_order`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    }
  });
  
  if (!response.ok) {
    console.log("❌ Error fetching modules:", response.status, response.statusText);
    const text = await response.text();
    console.log("Details:", text);
    return;
  }
  
  const modules = await response.json();
  
  if (modules.length === 0) {
    console.log("❌ No modules found in database. Please run the SQL commands first.");
    return;
  }
  
  console.log("✅ Modules found in database:\n");
  console.log("┌────┬─────────────────────┬────────────────────┬─────────────────┬────────┬─────────────────────────────────────┐");
  console.log("│ #  │ Code                │ Name               │ Category        │ Active │ Dependencies                        │");
  console.log("├────┼─────────────────────┼────────────────────┼─────────────────┼────────┼─────────────────────────────────────┤");
  
  modules.forEach((m, i) => {
    const num = String(i + 1).padStart(2);
    const code = (m.code || '-').padEnd(19);
    const name = (m.name || '-').padEnd(18);
    const cat = (m.category || '-').padEnd(15);
    const active = m.is_active ? 'Yes   ' : 'No    ';
    const deps = m.depends_on && m.depends_on.length > 0 ? m.depends_on.join(', ') : '-';
    console.log(`│ ${num} │ ${code} │ ${name} │ ${cat} │ ${active} │ ${deps.padEnd(35)} │`);
  });
  
  console.log("└────┴─────────────────────┴────────────────────┴─────────────────┴────────┴─────────────────────────────────────┘");
  console.log(`\n✅ Total modules: ${modules.length}/10`);
  
  // Check for missing dependencies
  const hasDepends = modules.some(m => m.depends_on && m.depends_on.length > 0);
  if (hasDepends) {
    console.log("✅ depends_on column is populated correctly");
  } else {
    console.log("⚠️  No modules have dependencies - verify depends_on column was added");
  }
  
  console.log("\n=== Verification Complete ===");
}

verifyModules().catch(console.error);
