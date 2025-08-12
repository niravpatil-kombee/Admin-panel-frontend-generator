
"use client";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

// Client-side validation has been removed.

export function UserForm() {
  const form = useForm<any>({
    // No resolver is used.
    // TODO: Add default values for an 'edit' form if needed
  });
  
  // Register file inputs separately as they are uncontrolled
  form.register("user_picture");

  function onSubmit(values: any) {
    // WARNING: Form data is NOT validated. Ensure you have server-side validation.
    // TODO: Send 'values' to your API endpoint
    console.log("Form Submitted (NO VALIDATION):", values);
    alert("Form data has been logged to the console. NO client-side validation was performed.");
  }

  return (
    <div className="max-w-4xl mx-auto my-8 p-8 border rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6">Manage User</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField control={form.control} name="id" render={({ field }) => (
    <FormItem>
      <FormLabel>Id</FormLabel>
      <FormControl><Input type="number" placeholder="Enter Id..." {...field} /></FormControl>
      <FormDescription>AUTO_INCREMENT</FormDescription>
      <FormMessage />
    </FormItem>
  )} />

<FormField control={form.control} name="name" render={({ field }) => (
    <FormItem>
      <FormLabel>Name</FormLabel>
      <FormControl><Input type="text" placeholder="Enter Name..." {...field} /></FormControl>
      
      <FormMessage />
    </FormItem>
  )} />

<FormField control={form.control} name="email" render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl><Input type="text" placeholder="Enter Email..." {...field} /></FormControl>
      
      <FormMessage />
    </FormItem>
  )} />

<FormField control={form.control} name="role_id" render={({ field }) => (
    <FormItem>
      <FormLabel>Role Id</FormLabel>
      <FormControl><Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl><SelectTrigger><SelectValue placeholder="Select a role id" /></SelectTrigger></FormControl>
        <SelectContent>
          <SelectItem value="null" disabled>No options configured</SelectItem>
        </SelectContent>
      </Select></FormControl>
      <FormDescription>Roles table id</FormDescription>
      <FormMessage />
    </FormItem>
  )} />

<FormField control={form.control} name="gender" render={({ field }) => (
    <FormItem>
      <FormLabel>Gender</FormLabel>
      <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
        <FormItem className="flex items-center space-x-3 space-y-0">
          <FormControl><RadioGroupItem value="Female" /></FormControl>
          <FormLabel className="font-normal">Female</FormLabel>
        </FormItem>
        <FormItem className="flex items-center space-x-3 space-y-0">
          <FormControl><RadioGroupItem value="Male" /></FormControl>
          <FormLabel className="font-normal">Male</FormLabel>
        </FormItem>
      </RadioGroup></FormControl>
      
      <FormMessage />
    </FormItem>
  )} />

<FormField control={form.control} name="profile" render={({ field }) => (
    <FormItem>
      <FormLabel>Profile</FormLabel>
      <FormControl><Input type="file" {...form.register("profile")} /></FormControl>
      
      <FormMessage />
    </FormItem>
  )} />

<FormField control={form.control} name="country_id" render={({ field }) => (
    <FormItem>
      <FormLabel>Country Id</FormLabel>
      <FormControl><Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl><SelectTrigger><SelectValue placeholder="Select a country id" /></SelectTrigger></FormControl>
        <SelectContent>
          <SelectItem value="null" disabled>No options configured</SelectItem>
        </SelectContent>
      </Select></FormControl>
      <FormDescription>Countries table ID</FormDescription>
      <FormMessage />
    </FormItem>
  )} />

<FormField control={form.control} name="state_id" render={({ field }) => (
    <FormItem>
      <FormLabel>State Id</FormLabel>
      <FormControl><Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl><SelectTrigger><SelectValue placeholder="Select a state id" /></SelectTrigger></FormControl>
        <SelectContent>
          <SelectItem value="null" disabled>No options configured</SelectItem>
        </SelectContent>
      </Select></FormControl>
      <FormDescription>States table ID</FormDescription>
      <FormMessage />
    </FormItem>
  )} />

<FormField control={form.control} name="city_id" render={({ field }) => (
    <FormItem>
      <FormLabel>City Id</FormLabel>
      <FormControl><Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl><SelectTrigger><SelectValue placeholder="Select a city id" /></SelectTrigger></FormControl>
        <SelectContent>
          <SelectItem value="null" disabled>No options configured</SelectItem>
        </SelectContent>
      </Select></FormControl>
      <FormDescription>Cities table ID</FormDescription>
      <FormMessage />
    </FormItem>
  )} />

<FormField control={form.control} name="user_picture|user_id|picture" render={({ field }) => (
    <FormItem>
      <FormLabel>User Picture|user Id|picture</FormLabel>
      <FormControl><Input type="file" {...form.register("user_picture|user_id|picture")} /></FormControl>
      
      <FormMessage />
    </FormItem>
  )} />

<FormField control={form.control} name="status" render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5"><FormLabel>Status</FormLabel></div>
          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
        </FormItem>
      )} />

<FormField control={form.control} name="bg_color" render={({ field }) => (
    <FormItem>
      <FormLabel>Bg Color</FormLabel>
      <FormControl><Input type="color" className="p-1 h-10 w-full" {...field} /></FormControl>
      <FormDescription> </FormDescription>
      <FormMessage />
    </FormItem>
  )} />
          <Button type="submit" size="lg" className="w-full md:w-auto">Save Changes</Button>
        </form>
      </Form>
    </div>
  );
}
