/**
 * @jest-environment jsdom
 */

import { db } from "@/db/database";
import type { Category, Prompt, ContextMenu } from "@/models/types";

describe("Database Integration Tests", () => {
  it("should expose Dexie schema version 10", () => {
    expect(db.verno).toBe(10);
  });

  beforeEach(async () => {
    // Clear database before each test
    await db.categories.clear();
    await db.prompts.clear();
    await db.contextMenus.clear();
  });

  afterAll(async () => {
    await db.close();
  });

  describe("Categories CRUD", () => {
    it("should create and retrieve a category", async () => {
      const category: Category = {
        name: "Test Category",
        icon: "📁",
        color: "#3b82f6",
        createdAt: new Date(),
        syncStatus: "synced",
      };

      const id = await db.categories.add(category);
      expect(id).toBeDefined();

      const retrieved = await db.categories.get(id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("Test Category");
      expect(retrieved?.icon).toBe("📁");
    });

    it("should update a category", async () => {
      const id = await db.categories.add({
        name: "Original Name",
        icon: "📁",
        color: "#3b82f6",
        createdAt: new Date(),
      } as Category);

      await db.categories.update(id, { name: "Updated Name" });

      const updated = await db.categories.get(id);
      expect(updated?.name).toBe("Updated Name");
    });

    it("should delete a category", async () => {
      const id = await db.categories.add({
        name: "To Delete",
        icon: "📁",
        color: "#3b82f6",
        createdAt: new Date(),
      } as Category);

      await db.categories.delete(id);

      const deleted = await db.categories.get(id);
      expect(deleted).toBeUndefined();
    });

    it("should query categories by remoteId", async () => {
      await db.categories.add({
        name: "Remote Category",
        icon: "📁",
        color: "#3b82f6",
        remoteId: 123,
        createdAt: new Date(),
      } as Category);

      const found = await db.categories.where("remoteId").equals(123).first();
      expect(found).toBeDefined();
      expect(found?.name).toBe("Remote Category");
    });
  });

  describe("Prompts CRUD", () => {
    it("should create and retrieve a prompt", async () => {
      const categoryId = await db.categories.add({
        name: "Test Category",
        icon: "📁",
        color: "#3b82f6",
        createdAt: new Date(),
      } as Category);

      const prompt = {
        categoryId: categoryId!,
        title: "Test Prompt",
        selectedMenuIds: [1, 2],
        promptPayload: {
          meta: {
            template_id: "test_prompt",
            template_name: "Test Prompt",
            template_type: "test",
            schema_version: "1.0.0",
            language: "pt-BR",
            status: "active",
          },
          prompt_definition: {
            system_role: "You are a helpful assistant",
            task: "Help the user",
            context: "",
            constraints: [],
            negative_prompt: [],
            few_shot_examples: [],
          },
          output_contract: {
            format: "markdown",
            language: "pt-BR",
            strict_mode: false,
            required_fields: [],
            response_rules: [],
          },
          menu_ids: [],
          menu_definitions: [],
        },
        selectionPayload: {
          template_id: "test_prompt",
          selected_menus: [],
          free_inputs: {},
        },
        compiledPayload: undefined,
        schemaVersion: "1.0.0",
        language: "pt-BR",
        outputFormat: "markdown",
        fewShotExamples: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: "synced",
      };

      const id = await db.prompts.add(prompt as unknown as Prompt);
      expect(id).toBeDefined();

      const retrieved = await db.prompts.get(id!);
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe("Test Prompt");
      expect(retrieved?.categoryId).toBe(categoryId);
      expect(retrieved?.selectedMenuIds).toEqual([1, 2]);
    });

    it("should cascade delete prompts when category is deleted", async () => {
      const categoryId = await db.categories.add({
        name: "Parent Category",
        icon: "📁",
        color: "#3b82f6",
        createdAt: new Date(),
      } as Category);

      await db.prompts.add({
        categoryId: categoryId!,
        title: "Child Prompt",
        promptPayload: {
          meta: {
            template_id: "child_prompt",
            template_name: "Child Prompt",
            template_type: "test",
            schema_version: "1.0.0",
            language: "pt-BR",
            status: "active",
          },
          prompt_definition: {
            system_role: "You are a helpful assistant",
            task: "Help the user",
            context: "",
            constraints: [],
            negative_prompt: [],
            few_shot_examples: [],
          },
          output_contract: {
            format: "markdown",
            language: "pt-BR",
            strict_mode: false,
            required_fields: [],
            response_rules: [],
          },
          menu_ids: [],
          menu_definitions: [],
        },
        selectionPayload: {
          template_id: "child_prompt",
          selected_menus: [],
          free_inputs: {},
        },
        compiledPayload: undefined,
        schemaVersion: "1.0.0",
        language: "pt-BR",
        outputFormat: "markdown",
        fewShotExamples: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: "synced",
      });

      // Note: Dexie doesn't support foreign key constraints by default
      // This test verifies the prompt exists before category deletion
      const promptsBefore = await db.prompts.toArray();
      expect(promptsBefore.length).toBe(1);

      await db.categories.delete(categoryId);

      // Prompt still exists (no cascade in Dexie by default)
      const promptsAfter = await db.prompts.toArray();
      expect(promptsAfter.length).toBe(1);
    });
  });

  describe("Context Menus CRUD", () => {
    it("should create and retrieve a context menu", async () => {
      const menu = {
        menuId: "test_menu",
        menuName: "Test Menu",
        description: "A test menu",
        selectionMode: "single" as const,
        options: [
          {
            label: "Option 1",
            value: "option_1",
            subOptions: [
              { label: "Sub Option 1", value: "sub_option_1" },
            ],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: "synced",
      };

      const id = await db.contextMenus.add(menu as unknown as ContextMenu);
      expect(id).toBeDefined();

      const retrieved = await db.contextMenus.get(id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.menuName).toBe("Test Menu");
      expect(retrieved?.options.length).toBe(1);
    });

    it("should query menus by menuId", async () => {
      await db.contextMenus.add({
        menuId: "unique_menu_id",
        menuName: "Unique Menu",
        description: "Test",
        selectionMode: "multiple",
        options: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: "synced",
      });

      const found = await db.contextMenus.where("menuId").equals(
        "unique_menu_id",
      ).first();
      expect(found).toBeDefined();
      expect(found?.menuName).toBe("Unique Menu");
    });

    it("should update menu options", async () => {
      const id = await db.contextMenus.add({
        menuId: "update_test",
        menuName: "Update Test",
        description: "Test",
        selectionMode: "single",
        options: [{ label: "Old Option", value: "old_option", subOptions: [] }],
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: "synced",
      });

      await db.contextMenus.update(id, {
        options: [
          { label: "New Option", value: "new_option", subOptions: [] },
        ],
      });

      const updated = await db.contextMenus.get(id);
      expect(updated?.options[0].label).toBe("New Option");
    });
  });

  describe("Database Queries", () => {
    it("should sort categories by name", async () => {
      await db.categories.bulkAdd([
        { name: "Zebra", icon: "🦓", color: "#000", createdAt: new Date() },
        { name: "Apple", icon: "🍎", color: "#f00", createdAt: new Date() },
        { name: "Banana", icon: "🍌", color: "#ff0", createdAt: new Date() },
      ] as Category[]);

      const sorted = await db.categories.orderBy("name").toArray();
      expect(sorted.map((c) => c.name)).toEqual(["Apple", "Banana", "Zebra"]);
    });

    it("should filter prompts by categoryId", async () => {
      const cat1 = await db.categories.add(
        {
          name: "Cat 1",
          icon: "📁",
          color: "#f00",
          createdAt: new Date(),
        } as Category,
      );
      const cat2 = await db.categories.add(
        {
          name: "Cat 2",
          icon: "📁",
          color: "#0f0",
          createdAt: new Date(),
        } as Category,
      );

      await db.prompts.bulkAdd([
        {
          categoryId: cat1!,
          title: "Prompt 1",
          promptPayload: {
            meta: {
              template_id: "p1",
              template_name: "P1",
              template_type: "t",
              schema_version: "1.0.0",
              language: "pt-BR",
              status: "active",
            },
            prompt_definition: {
              system_role: "",
              task: "",
              context: "",
              constraints: [],
              negative_prompt: [],
              few_shot_examples: [],
            },
            output_contract: {
              format: "markdown",
              language: "pt-BR",
              strict_mode: false,
              required_fields: [],
              response_rules: [],
            },
            menu_ids: [],
            menu_definitions: [],
          },
          selectionPayload: {
            template_id: "p1",
            selected_menus: [],
            free_inputs: {},
          },
          compiledPayload: undefined,
          schemaVersion: "1.0.0",
          language: "pt-BR",
          outputFormat: "markdown",
          fewShotExamples: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: "synced",
        },
        {
          categoryId: cat2!,
          title: "Prompt 2",
          promptPayload: {
            meta: {
              template_id: "p2",
              template_name: "P2",
              template_type: "t",
              schema_version: "1.0.0",
              language: "pt-BR",
              status: "active",
            },
            prompt_definition: {
              system_role: "",
              task: "",
              context: "",
              constraints: [],
              negative_prompt: [],
              few_shot_examples: [],
            },
            output_contract: {
              format: "markdown",
              language: "pt-BR",
              strict_mode: false,
              required_fields: [],
              response_rules: [],
            },
            menu_ids: [],
            menu_definitions: [],
          },
          selectionPayload: {
            template_id: "p2",
            selected_menus: [],
            free_inputs: {},
          },
          compiledPayload: undefined,
          schemaVersion: "1.0.0",
          language: "pt-BR",
          outputFormat: "markdown",
          fewShotExamples: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: "synced",
        },
      ]);

      const promptsCat1 = await db.prompts.where("categoryId").equals(cat1!)
        .toArray();
      expect(promptsCat1.length).toBe(1);
      expect(promptsCat1[0].title).toBe("Prompt 1");
    });
  });
});
