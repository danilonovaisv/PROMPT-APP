#!/usr/bin/env python3
"""
Flush Workflow Executor
Implements the /flush command functionality.
"""

import sys
from typing import Any, Dict, List

from workflow_executor import WorkflowExecutor


class FlushExecutor(WorkflowExecutor):
    """Executor for Flush workflow"""

# REFACTORED: # Extract smaller functions from this long function
        """Execute Flush workflow"""
        # Parse arguments
        max_tasks = None
        safe_only = False
        report = False

        for arg in args:
            if arg.startswith("--max-tasks="):
                max_tasks = int(arg.split("=")[1])
            elif arg == "--safe-only":
                safe_only = True
            elif arg == "--report":
                report = True

        # Import and use Flush Executor
        try:
            sys.path.insert(0, ".windsurf")
            from flush_executor import FlushExecutor

            executor = FlushExecutor()
            results = executor.start_flush(max_tasks, safe_only)

            if report:
                self.print_section(
                    "Flush Report",
                    f"Processed: {results['processed']} messages\n"
                    f"Errors: {results['errors']} messages\n"
                    f"Duration: {results['duration']:.1f}s\n"
                    f"Model: {results['model']}",
                )
            else:
                self.print_section(
                    "Flush Complete",
                    f"🎯 Flush complete!\n"
                    f"   Processed: {results['processed']} messages\n"
                    f"   Errors: {results['errors']} messages\n"
                    f"   Duration: {results['duration']:.1f}s\n"
                    f"   Model: {results['model']} (FREE)",
                )

            return results

        except ImportError:
            return {"success": False, "message": "Flush Executor not available"}
        except Exception as e:
            return {"success": False, "message": f"Error: {e}"}

# REFACTORED: # Extract smaller functions from this long function
        """Show help for Flush workflow"""
        help_text = """
🚰 Flush Workflow

This workflow rapidly processes queued messages using the free SWE-1.5 model.

Usage:
  /flush [--max-tasks=N] [--safe-only] [--report]

Options:
  --max-tasks=N    Limit to N messages
  --safe-only     Only process safe tasks
  --report        Show detailed report

Description:
  - Switches to SWE-1.5 (FREE model)
  - Auto-accepts commands
  - Processes queued messages rapidly
  - Clears message queue to reduce context
  - Restores settings after completion

The flush system processes the message queue, NOT pinned tasks.
Use /pop to execute pinned tasks.

Related commands:
  /pin <task>         - Save task for later
  /pop                - Execute all pinned tasks
  /show-pins          - Display pinned tasks
        """

        self.print_section("Flush Help", help_text.strip())
        return {"success": True, "message": help_text.strip()}


if __name__ == "__main__":
    from workflow_executor import main

    main()
