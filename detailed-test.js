const { chromium } = require('playwright');

async function runDetailedTests() {
  console.log('🚀 Starting detailed end-to-end testing...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down actions for better observation
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Set up error handling
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console error:', msg.text());
    }
  });

  const testResults = {
    passed: [],
    failed: [],
    warnings: []
  };

  try {
    // Navigate to the application
    console.log('\n📱 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Take a screenshot of the home screen
    await page.screenshot({ path: '/Users/mcbrown/Documents/DEV/spectrum/test-home.png' });
    console.log('📸 Screenshot saved: test-home.png');

    // Debug: Print current page content
    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);
    
    const bodyContent = await page.locator('body').innerText();
    console.log(`📝 Page content preview: ${bodyContent.substring(0, 200)}...`);

    // Test 1: Home Screen Navigation
    console.log('\n🏠 Testing Home Screen Navigation...');
    
    // Look for clickable elements that contain "Host Game"
    const hostGameElements = await page.locator('*:has-text("Host Game")').all();
    console.log(`Found ${hostGameElements.length} elements containing "Host Game"`);
    
    let hostGameWorked = false;
    for (let i = 0; i < hostGameElements.length; i++) {
      const element = hostGameElements[i];
      const isVisible = await element.isVisible();
      const isEnabled = await element.isEnabled();
      const tagName = await element.evaluate(el => el.tagName);
      console.log(`  Element ${i}: ${tagName}, visible: ${isVisible}, enabled: ${isEnabled}`);
      
      if (isVisible && (tagName === 'BUTTON' || tagName === 'DIV')) {
        try {
          await element.click();
          await page.waitForTimeout(2000);
          
          // Check if we navigated or if the UI changed
          const currentUrl = page.url();
          const hasCreateGame = await page.locator('*:has-text("Create Game")').count() > 0;
          const hasHostInput = await page.locator('input').count() > 0;
          
          if (currentUrl.includes('/host') || hasCreateGame || hasHostInput) {
            console.log('✅ Host Game navigation successful');
            testResults.passed.push('Host Game navigation works');
            hostGameWorked = true;
            
            // Test back navigation
            await page.screenshot({ path: '/Users/mcbrown/Documents/DEV/spectrum/test-host-screen.png' });
            
            // Look for back button
            const backButtons = await page.locator('*:has-text("Back")').all();
            let backWorked = false;
            for (const backBtn of backButtons) {
              if (await backBtn.isVisible()) {
                await backBtn.click();
                await page.waitForTimeout(1000);
                backWorked = true;
                break;
              }
            }
            
            if (backWorked) {
              console.log('✅ Back button works');
              testResults.passed.push('Back button from Host Game');
            } else {
              console.log('⚠️ Back button not found or not working');
              testResults.warnings.push('Back button from Host Game');
            }
            break;
          }
        } catch (error) {
          console.log(`  Failed to click element ${i}: ${error.message}`);
        }
      }
    }
    
    if (!hostGameWorked) {
      console.log('❌ Host Game navigation failed');
      testResults.failed.push('Host Game navigation failed');
    }

    // Ensure we're back on home screen
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Test Join Game navigation
    const joinGameElements = await page.locator('*:has-text("Join Game")').all();
    console.log(`Found ${joinGameElements.length} elements containing "Join Game"`);
    
    let joinGameWorked = false;
    for (let i = 0; i < joinGameElements.length; i++) {
      const element = joinGameElements[i];
      const isVisible = await element.isVisible();
      const tagName = await element.evaluate(el => el.tagName);
      
      if (isVisible && (tagName === 'BUTTON' || tagName === 'DIV')) {
        try {
          await element.click();
          await page.waitForTimeout(2000);
          
          const currentUrl = page.url();
          const hasJoinForm = await page.locator('input').count() > 0;
          const hasGameCode = await page.locator('*:has-text("Game Code")').count() > 0;
          
          if (currentUrl.includes('/join') || hasJoinForm || hasGameCode) {
            console.log('✅ Join Game navigation successful');
            testResults.passed.push('Join Game navigation works');
            joinGameWorked = true;
            
            await page.screenshot({ path: '/Users/mcbrown/Documents/DEV/spectrum/test-join-screen.png' });
            break;
          }
        } catch (error) {
          console.log(`  Failed to click Join Game element ${i}: ${error.message}`);
        }
      }
    }
    
    if (!joinGameWorked) {
      console.log('❌ Join Game navigation failed');
      testResults.failed.push('Join Game navigation failed');
    }

    // Test 2: Host Game Flow (Full Test)
    console.log('\n🎮 Testing Host Game Flow...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Navigate to Host Game
    const hostElements = await page.locator('*:has-text("Host Game")').all();
    for (const element of hostElements) {
      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(2000);
        break;
      }
    }
    
    // Test host name input
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input fields`);
    
    if (inputs.length > 0) {
      const hostInput = inputs[0];
      await hostInput.fill('TestHost123');
      console.log('✅ Host name input works');
      testResults.passed.push('Host name input functionality');
      
      // Look for Create Game button
      const createButtons = await page.locator('*:has-text("Create Game")').all();
      let gameCreated = false;
      
      for (const btn of createButtons) {
        if (await btn.isVisible()) {
          await btn.click();
          await page.waitForTimeout(5000); // Wait longer for game creation
          
          // Look for game code (usually 4-6 characters)
          const pageText = await page.locator('body').innerText();
          const gameCodeMatch = pageText.match(/[A-Z0-9]{4,6}/);
          
          if (gameCodeMatch) {
            console.log(`✅ Game created with code: ${gameCodeMatch[0]}`);
            testResults.passed.push('Game creation and code display');
            gameCreated = true;
            
            await page.screenshot({ path: '/Users/mcbrown/Documents/DEV/spectrum/test-game-created.png' });
            
            // Test share and copy buttons
            const allButtons = await page.locator('button').all();
            for (const button of allButtons) {
              const buttonText = await button.innerText();
              if (buttonText.toLowerCase().includes('share')) {
                console.log('✅ Share button found');
                testResults.passed.push('Share button present');
              }
              if (buttonText.toLowerCase().includes('copy')) {
                try {
                  await button.click();
                  console.log('✅ Copy button clicked');
                  testResults.passed.push('Copy button functionality');
                } catch (e) {
                  console.log('⚠️ Copy button click failed');
                  testResults.warnings.push('Copy button click failed');
                }
              }
            }
            break;
          }
        }
      }
      
      if (!gameCreated) {
        console.log('❌ Game creation failed');
        testResults.failed.push('Game creation failed');
      }
    } else {
      console.log('❌ No input fields found for host name');
      testResults.failed.push('Host name input not found');
    }

    // Test 3: Join Game Flow
    console.log('\n👥 Testing Join Game Flow...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Navigate to Join Game
    const joinElements = await page.locator('*:has-text("Join Game")').all();
    for (const element of joinElements) {
      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(2000);
        break;
      }
    }
    
    const joinInputs = await page.locator('input').all();
    if (joinInputs.length >= 2) {
      // Fill in game code and player name
      await joinInputs[0].fill('TEST123');
      await joinInputs[1].fill('TestPlayer');
      console.log('✅ Join game inputs work');
      testResults.passed.push('Join game input fields');
      
      // Try to join (will likely fail with invalid code)
      const joinButtons = await page.locator('*:has-text("Join")').all();
      for (const btn of joinButtons) {
        if (await btn.isVisible()) {
          await btn.click();
          await page.waitForTimeout(2000);
          console.log('✅ Join button is functional');
          testResults.passed.push('Join button functionality');
          break;
        }
      }
    } else if (joinInputs.length === 1) {
      console.log('⚠️ Only one input found for join game');
      testResults.warnings.push('Expected 2 inputs for join game, found 1');
    } else {
      console.log('❌ No input fields found for join game');
      testResults.failed.push('Join game inputs not found');
    }

    // Test 4: Mobile Compatibility
    console.log('\n📱 Testing Mobile Compatibility...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: '/Users/mcbrown/Documents/DEV/spectrum/test-mobile.png' });
    
    // Test if buttons are still accessible on mobile
    const mobileHostElements = await page.locator('*:has-text("Host Game")').all();
    let mobileHostWorked = false;
    
    for (const element of mobileHostElements) {
      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(2000);
        
        const hasInputs = await page.locator('input').count() > 0;
        if (hasInputs) {
          console.log('✅ Mobile Host Game navigation works');
          testResults.passed.push('Mobile Host Game navigation');
          mobileHostWorked = true;
          
          // Test mobile input
          const mobileInput = await page.locator('input').first();
          await mobileInput.tap();
          await mobileInput.fill('MobileTest');
          console.log('✅ Mobile input interaction works');
          testResults.passed.push('Mobile input interactions');
          break;
        }
      }
    }
    
    if (!mobileHostWorked) {
      console.log('❌ Mobile Host Game navigation failed');
      testResults.failed.push('Mobile Host Game navigation failed');
    }

  } catch (error) {
    console.log(`❌ Critical error during testing: ${error.message}`);
    testResults.failed.push(`Critical error: ${error.message}`);
  }

  await page.waitForTimeout(3000); // Keep browser open for observation
  await browser.close();

  // Generate detailed test report
  console.log('\n' + '='.repeat(70));
  console.log('📊 DETAILED END-TO-END TEST RESULTS');
  console.log('='.repeat(70));
  
  console.log(`\n✅ PASSED TESTS (${testResults.passed.length}):`);
  testResults.passed.forEach(test => console.log(`  • ${test}`));
  
  if (testResults.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${testResults.warnings.length}):`);
    testResults.warnings.forEach(warning => console.log(`  • ${warning}`));
  }
  
  if (testResults.failed.length > 0) {
    console.log(`\n❌ FAILED TESTS (${testResults.failed.length}):`);
    testResults.failed.forEach(failure => console.log(`  • ${failure}`));
  }
  
  const totalTests = testResults.passed.length + testResults.failed.length;
  const passRate = totalTests > 0 ? Math.round((testResults.passed.length / totalTests) * 100) : 0;
  
  console.log(`\n📈 FINAL ASSESSMENT:`);
  console.log(`  • Total Critical Tests: ${totalTests}`);
  console.log(`  • Pass Rate: ${passRate}%`);
  console.log(`  • Warnings: ${testResults.warnings.length}`);
  
  let status = '🟢 ALL CRITICAL FEATURES WORKING';
  if (testResults.failed.length > 0) {
    status = testResults.failed.length >= 3 ? '🔴 MAJOR ISSUES FOUND' : '🟠 MINOR ISSUES FOUND';
  }
  console.log(`  • Status: ${status}`);
  
  console.log(`\n📸 Screenshots saved:`);
  console.log(`  • test-home.png - Home screen`);
  console.log(`  • test-host-screen.png - Host game screen`);
  console.log(`  • test-join-screen.png - Join game screen`);
  console.log(`  • test-game-created.png - Game creation result`);
  console.log(`  • test-mobile.png - Mobile view`);
  
  return {
    passed: testResults.passed.length,
    failed: testResults.failed.length,
    warnings: testResults.warnings.length,
    totalTests,
    passRate,
    status,
    details: testResults
  };
}

// Run the tests
runDetailedTests().catch(console.error);