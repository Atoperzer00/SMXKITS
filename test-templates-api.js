const fetch = require('node-fetch');

// Test the class templates API
async function testTemplatesAPI() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    console.log('🧪 Testing Class Templates API...');
    
    // Test GET all templates
    console.log('\n📋 Testing GET /api/class-templates');
    const response = await fetch(`${baseUrl}/api/class-templates`);
    
    if (response.ok) {
      const templates = await response.json();
      console.log(`✅ Found ${templates.length} templates:`);
      templates.forEach(template => {
        console.log(`   - ${template.difficulty}: ${template.name} (${template.durationWeeks} weeks, ${template.modules.length} modules)`);
      });
    } else {
      console.log(`❌ Failed to fetch templates: ${response.status} ${response.statusText}`);
    }
    
    // Test GET specific template
    console.log('\n📋 Testing GET /api/class-templates/Easy');
    const easyResponse = await fetch(`${baseUrl}/api/class-templates/Easy`);
    
    if (easyResponse.ok) {
      const easyTemplate = await easyResponse.json();
      console.log(`✅ Easy template: ${easyTemplate.name}`);
      console.log(`   Modules: ${easyTemplate.modules.length}`);
      easyTemplate.modules.forEach((module, index) => {
        console.log(`   ${index + 1}. ${module.name} (${module.lessons.length} lessons)`);
      });
    } else {
      console.log(`❌ Failed to fetch Easy template: ${easyResponse.status} ${easyResponse.statusText}`);
    }
    
    console.log('\n🎉 Template API test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test if called directly
if (require.main === module) {
  testTemplatesAPI();
}

module.exports = testTemplatesAPI;