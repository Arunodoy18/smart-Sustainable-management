"""
Quick test script for CLIP classifier
======================================

Test the CLIP model integration without starting the full API.
"""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from PIL import Image
import logging

# Setup basic logging
logging.basicConfig(level=logging.INFO)


async def test_clip_classifier():
    """Test CLIP classifier with a sample image."""
    print("=" * 60)
    print("CLIP Waste Classifier Test")
    print("=" * 60)
    
    try:
        # Import CLIP classifier
        from src.ml.classifiers.clip_classifier import CLIPWasteClassifier
        
        print("\n✓ CLIP classifier imported successfully")
        
        # Create classifier
        print("\nInitializing CLIP classifier...")
        classifier = CLIPWasteClassifier()
        
        print(f"  Model: {classifier.model_name}")
        print(f"  Version: {classifier.model_version}")
        print(f"  Device: {classifier.device}")
        
        # Load model
        print("\nLoading CLIP model (first run will download ~600MB)...")
        await classifier.load()
        
        print("✓ Model loaded successfully")
        print(f"  Model size: {classifier._get_model_size_mb():.2f} MB")
        print(f"  Text embeddings cached: {len(classifier._category_embeddings)} categories")
        
        # Create test image
        print("\nCreating test image...")
        test_image = Image.new('RGB', (224, 224), color=(100, 200, 100))
        
        # Run prediction
        print("Running prediction...")
        prediction = await classifier.predict(test_image)
        
        print("\n" + "=" * 60)
        print("PREDICTION RESULTS")
        print("=" * 60)
        print(f"Category: {prediction.category.value}")
        print(f"Confidence: {prediction.confidence:.2%}")
        print(f"Subcategory: {prediction.subcategory.value if prediction.subcategory else 'None'}")
        
        if prediction.raw_scores:
            print("\nAll category scores:")
            sorted_scores = sorted(
                prediction.raw_scores.items(),
                key=lambda x: x[1],
                reverse=True
            )
            for category, score in sorted_scores:
                print(f"  {category}: {score:.2%}")
        
        print("\n" + "=" * 60)
        print("✓ TEST PASSED - CLIP classifier is working!")
        print("=" * 60)
        
        return True
        
    except ImportError as e:
        print(f"\n✗ Import Error: {e}")
        print("\nMake sure transformers and torch are installed:")
        print("  pip install transformers torch")
        return False
        
    except Exception as e:
        print(f"\n✗ Test Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_pipeline_integration():
    """Test CLIP integration with the full pipeline."""
    print("\n" + "=" * 60)
    print("PIPELINE INTEGRATION TEST")
    print("=" * 60)
    
    try:
        # Set environment to use CLIP
        import os
        os.environ['USE_CLIP_CLASSIFIER'] = 'true'
        
        from src.ml.pipeline import ClassificationPipeline
        from PIL import Image
        
        print("\nInitializing pipeline with CLIP...")
        pipeline = ClassificationPipeline()
        await pipeline.initialize()
        
        print("✓ Pipeline initialized")
        print(f"  Classifier: {pipeline.classifier.model_name}")
        
        # Test classification
        test_image = Image.new('RGB', (224, 224), color=(50, 50, 150))
        
        print("\nRunning full pipeline classification...")
        result = await pipeline.classify(test_image)
        
        print("\n" + "=" * 60)
        print("PIPELINE RESULTS")
        print("=" * 60)
        print(f"Category: {result.category.value}")
        print(f"Subcategory: {result.subcategory.value if result.subcategory else 'None'}")
        print(f"Confidence: {result.confidence:.2%}")
        print(f"Confidence Tier: {result.confidence_tier.value}")
        print(f"Bin Type: {result.bin_type.value}")
        print(f"Safety Passed: {result.safety_passed}")
        print(f"Processing Time: {result.processing_time_ms}ms")
        print(f"Model: {result.primary_model}")
        
        print("\n" + "=" * 60)
        print("✓ PIPELINE TEST PASSED!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n✗ Pipeline Test Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests."""
    print("\n🚀 Starting CLIP Integration Tests\n")
    
    # Test 1: CLIP classifier alone
    test1_passed = await test_clip_classifier()
    
    if test1_passed:
        # Test 2: Full pipeline integration
        test2_passed = await test_pipeline_integration()
        
        if test2_passed:
            print("\n🎉 ALL TESTS PASSED! CLIP is ready to use.")
            print("\nTo enable CLIP in your API:")
            print("  1. Set USE_CLIP_CLASSIFIER=true in .env")
            print("  2. Restart the API server")
            print("  3. CLIP will automatically classify waste images")
            return 0
    
    print("\n⚠️  Some tests failed. Check errors above.")
    return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
