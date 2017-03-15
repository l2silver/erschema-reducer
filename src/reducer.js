// @flow
import reduxOverlord from 'redux-overlord'
import {combineReducers} from 'redux'
import {entityReducer, relationshipReducer, relationshipPageReducer} from 'erschema-action-handlers'
import hor from './hor'
import type {$schema, $entitySchema} from 'erschema/types'
import type {$mapOf, $reducer} from './hor'

type $input = {
  schema: $schema,
  entities?: $mapOf<$mapOf<$reducer>>,
  relationships?: $mapOf<$mapOf<$reducer>>,
  overlordActions?: $mapOf<$reducer>,
  pageSchema?: $schema,
}

const getPageRelationships = function getPageRelationships(pageSchema: $schema){
  return Object.keys(pageSchema).reduce((finalResult, pageName)=>{
    finalResult[pageName] = pageSchema[pageName].relationships
    return finalResult
  }, {})
}

const getPageModelGenerator = function(schema: $schema){
  return function(entity){
    return schema[entity.id].Model
  }
}

export default function({schema, entities = {}, relationships = {}, overlordActions = {}, pageSchema}: $input){
  const pageEntity = {}
  const pageRelationship = {}
  if(pageSchema){
    pageEntity.pages = entities.pages || entityReducer({name: 'pages', modelGenerator: getPageModelGenerator(pageSchema)})
    pageRelationship.pages = relationships.pages || relationshipPageReducer({name: 'pages', relationships: getPageRelationships(pageSchema)})
  }
  const entityReducers = Object.keys(schema).reduce((finalResult, schemaName)=>{
    const entitySchema = schema[schemaName]
    finalResult[schemaName] = entities[schemaName] || entityReducer({
      name: schemaName,
      Model: entitySchema.Model
    })
    return finalResult
  }, pageEntity)
  const relationshipReducers = Object.keys(schema).reduce((finalResult, schemaName)=>{
    const entitySchema = schema[schemaName]
    // $FlowFixMe
    const {relationships} = entitySchema
    finalResult[schemaName] = relationships[schemaName] || relationshipReducer({
      name: schemaName,
      relationships,
    })
    return finalResult
  }, pageRelationship)
  const entityRelationshipReducers = combineReducers({
    entities: combineReducers(entityReducers),
    relationships: combineReducers(relationshipReducers),
  })
  return reduxOverlord(entityRelationshipReducers, hor(overlordActions))
}