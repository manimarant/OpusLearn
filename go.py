#!/usr/bin/env python3
"""
Pipeline runner script for OpusLearn
Handles pipeline execution with configurable runners and configurations
"""

import argparse
import os
import sys
import subprocess
import yaml
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PipelineRunner:
    def __init__(self, config_path, pipeline_dir, runner='bash'):
        self.config_path = Path(config_path)
        self.pipeline_dir = Path(pipeline_dir)
        self.runner = runner
        self.config = None
        
    def load_config(self):
        """Load pipeline configuration from YAML file"""
        try:
            if not self.config_path.exists():
                logger.error(f"Config file not found: {self.config_path}")
                return False
                
            with open(self.config_path, 'r') as f:
                self.config = yaml.safe_load(f)
                
            logger.info(f"Loaded config from {self.config_path}")
            return True
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return False
    
    def setup_pipeline_dir(self):
        """Create pipeline directory if it doesn't exist"""
        try:
            self.pipeline_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"Pipeline directory ready: {self.pipeline_dir}")
            return True
        except Exception as e:
            logger.error(f"Error creating pipeline directory: {e}")
            return False
    
    def run_command(self, command, cwd=None):
        """Execute a command using the specified runner"""
        try:
            if cwd is None:
                cwd = self.pipeline_dir
                
            logger.info(f"Running command: {command}")
            
            if self.runner == 'bash':
                result = subprocess.run(
                    command,
                    shell=True,
                    cwd=cwd,
                    capture_output=True,
                    text=True
                )
            else:
                result = subprocess.run(
                    [self.runner] + command.split(),
                    cwd=cwd,
                    capture_output=True,
                    text=True
                )
            
            if result.returncode == 0:
                logger.info(f"Command succeeded: {command}")
                if result.stdout:
                    logger.info(f"Output: {result.stdout}")
            else:
                logger.error(f"Command failed: {command}")
                if result.stderr:
                    logger.error(f"Error: {result.stderr}")
                    
            return result.returncode == 0
            
        except Exception as e:
            logger.error(f"Error running command '{command}': {e}")
            return False
    
    def run_pipeline(self):
        """Execute the pipeline based on configuration"""
        if not self.load_config():
            return False
            
        if not self.setup_pipeline_dir():
            return False
        
        # Check if config has pipeline steps
        if not self.config:
            logger.error("No configuration loaded")
            return False
            
        # Example pipeline execution based on common pipeline structure
        if 'steps' in self.config:
            for i, step in enumerate(self.config['steps']):
                logger.info(f"Executing step {i+1}: {step.get('name', 'Unnamed step')}")
                
                if 'command' in step:
                    if not self.run_command(step['command']):
                        logger.error(f"Step {i+1} failed")
                        return False
                        
        elif 'commands' in self.config:
            for i, command in enumerate(self.config['commands']):
                logger.info(f"Executing command {i+1}: {command}")
                if not self.run_command(command):
                    logger.error(f"Command {i+1} failed")
                    return False
                    
        else:
            logger.warning("No steps or commands found in config. Creating sample pipeline...")
            # Create a basic pipeline structure
            sample_commands = [
                "echo 'Pipeline started'",
                "pwd",
                "ls -la",
                "echo 'Pipeline completed'"
            ]
            
            for i, command in enumerate(sample_commands):
                logger.info(f"Executing sample command {i+1}: {command}")
                if not self.run_command(command):
                    logger.error(f"Sample command {i+1} failed")
                    return False
        
        logger.info("Pipeline execution completed successfully")
        return True

def main():
    parser = argparse.ArgumentParser(description='Pipeline runner for OpusLearn')
    parser.add_argument('action', choices=['run', 'init', 'status'], 
                       help='Action to perform')
    parser.add_argument('--pipeline-config', required=True,
                       help='Path to pipeline configuration YAML file')
    parser.add_argument('--pipeline-dir', required=True,
                       help='Directory for pipeline execution')
    parser.add_argument('--runner', default='bash',
                       help='Command runner (default: bash)')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Create pipeline runner
    runner = PipelineRunner(args.pipeline_config, args.pipeline_dir, args.runner)
    
    if args.action == 'run':
        success = runner.run_pipeline()
        sys.exit(0 if success else 1)
        
    elif args.action == 'init':
        # Initialize pipeline directory and create sample config
        if runner.setup_pipeline_dir():
            logger.info("Pipeline initialized successfully")
            
            # Create sample config if it doesn't exist
            config_path = Path(args.pipeline_config)
            if not config_path.exists():
                config_path.parent.mkdir(parents=True, exist_ok=True)
                sample_config = {
                    'name': 'Sample Pipeline',
                    'description': 'A sample pipeline configuration',
                    'steps': [
                        {
                            'name': 'Setup',
                            'command': 'echo "Setting up pipeline"'
                        },
                        {
                            'name': 'Process',
                            'command': 'echo "Processing data"'
                        },
                        {
                            'name': 'Cleanup',
                            'command': 'echo "Cleaning up"'
                        }
                    ]
                }
                
                with open(config_path, 'w') as f:
                    yaml.dump(sample_config, f, default_flow_style=False)
                    
                logger.info(f"Created sample config at {config_path}")
            
            sys.exit(0)
        else:
            sys.exit(1)
            
    elif args.action == 'status':
        # Check status of pipeline
        if runner.pipeline_dir.exists():
            logger.info(f"Pipeline directory exists: {runner.pipeline_dir}")
            
            # List files in pipeline directory
            files = list(runner.pipeline_dir.iterdir())
            if files:
                logger.info("Pipeline directory contents:")
                for file in files:
                    logger.info(f"  - {file.name}")
            else:
                logger.info("Pipeline directory is empty")
        else:
            logger.info(f"Pipeline directory does not exist: {runner.pipeline_dir}")
            
        if runner.config_path.exists():
            logger.info(f"Config file exists: {runner.config_path}")
        else:
            logger.info(f"Config file does not exist: {runner.config_path}")
            
        sys.exit(0)

if __name__ == '__main__':
    main()
