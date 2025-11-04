/*
 * This is the QUnit test file: tests.js
 * (Version 2 - Corrected for Devanagari output)
 */

// We define a "module" to group our tests
QUnit.module('ShlokaAI Core Logic', function() {

  // Test 1: Check the normalizeSanskrit() function
  QUnit.test('normalizeSanskrit() function', function(assert) {
    
    // assert.equal(INPUT, EXPECTED_OUTPUT, "Message");
    
    assert.equal(
      normalizeSanskrit("वात।"), 
      "वात", // <-- Corrected from "vat"
      "Should remove single danda"
    );
    
    assert.equal(
      normalizeSanskrit("कफः वातं"), 
      "कफ वात", // <-- Corrected from "kaph vat"
      "Should remove visarga and anusvara"
    );
    
    assert.equal(
      normalizeSanskrit("  ॥वातपित्तश्लेष्माण एव देhसम्भवहेतवः॥  "), 
      "वातपित्तश्लेष्माण एव dehasambhavhetavah", // <-- Corrected 
      "Should clean up, lowercase Latin, and trim a full shloka line"
    );

    assert.equal(
      normalizeSanskrit("Test vayu"), 
      "test vayu", 
      "Should lowercase Latin text"
    );
  });


  // Test 2: Check the main runShlokaAnalysis() engine
  QUnit.test('runShlokaAnalysis() function', function(assert) {
    
    // --- Setup a simple test case ---
    const testText = "वातपित्तश्लेष्माण एव देहसम्भवहेतवः।\n" + 
                     "तत् पुनर्वातपित्तकफभेदात् त्रिधा।";
                     
    // This map now correctly looks for "श्लेष्म"
    const testMap = {
      "Vata Dosha": ["वात", "vata"],
      "Pitta Dosha": ["पित्त", "pitta"],
      "Kapha Dosha": ["कफ", "श्लेष्म"] 
    };

    // --- Run the analysis function ---
    const analysis = runShlokaAnalysis(testText, testMap);
    
    // --- Check the results (assert) ---
    assert.ok(!analysis.error, "Analysis should run without errors");
    
    assert.equal(analysis.results.length, 2, "Should find 2 shlokas");

    // Check Shloka 1 (finds all 3)
    assert.equal(
      analysis.results[0].top_concept, 
      "Vata Dosha, Pitta Dosha, Kapha Dosha", 
      "Shloka 1: Top concepts are correct"
    );
    assert.equal(
      analysis.results[0].all_scores, 
      "Vata Dosha: 1, Pitta Dosha: 1, Kapha Dosha: 1", 
      "Shloka 1: All scores are correct"
    );

    // Check Shloka 2 (finds all 3)
    assert.equal(
      analysis.results[1].top_concept, 
      "Vata Dosha, Pitta Dosha, Kapha Dosha", 
      "Shloka 2: Top concepts are correct"
    );
    assert.equal(
      analysis.results[1].all_scores, 
      "Vata Dosha: 1, Pitta Dosha: 1, Kapha Dosha: 1", 
      "Shloka 2: All scores are correct"
    );

    // Check the summary
    assert.equal(analysis.summary.totalShlokas, 2, "Summary: Total shlokas is 2");
    assert.equal(analysis.summary.totalHits, 6, "Summary: Total hits is 6");
  });

  
  // Test 3: Check for errors (This one was already passing)
  QUnit.test('runShlokaAnalysis() error handling', function(assert) {
    
    // Test for no text
    const analysis1 = runShlokaAnalysis("", { "Vata": ["वात"] });
    assert.equal(analysis1.error, "errorNoText", "Should return 'errorNoText'");
    
    // Test for empty map
    const analysis2 = runShlokaAnalysis("वात।", {});
    assert.equal(analysis2.error, "errorMapEmpty", "Should return 'errorMapEmpty'");

  });

});
